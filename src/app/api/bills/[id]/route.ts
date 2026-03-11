import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateSplit } from "@/lib/split-engine";
import { createBillSchema } from "@/lib/validators"; // The Update schema is the same shape
import { z } from "zod";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

// Reusable Ownership Check
async function fetchAndCheckOwnership(id: string, req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { errorResponse: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  // Fetch bill (public read is allowed by RLS, so this always works if it exists)
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (billError || !bill) {
    return { errorResponse: NextResponse.json({ error: "Bill not found" }, { status: 404 }) };
  }

  if (bill.user_id !== user.id) {
    return { errorResponse: NextResponse.json({ error: "Forbidden: Not the bill owner" }, { status: 403 }) };
  }

  return { supabase, user, bill };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    const supabase = await getSupabase();

    // Fetch bill (public read is allowed by RLS, so this always works if it exists)
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .single();

    if (billError || !bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Fetch related items
    const [ { data: items }, { data: participants }, { data: assignments } ] = await Promise.all([
      supabase.from("bill_items").select("*").eq("bill_id", id),
      supabase.from("participants").select("*").eq("bill_id", id),
      // To get assignments for a bill, we join through bill_items
      // Fetch item assignments by fetching all items first
      supabase.from("bill_items").select("id").eq("bill_id", id).then(async ({ data: itemData }) => {
        const itemIds = itemData?.map((i: any) => i.id) || [];
        if (itemIds.length === 0) return { data: [] };
        return supabase.from("item_assignments").select("*").in("bill_item_id", itemIds);
      })
    ]);

    const resolvedItems = items || [];
    const resolvedParticipants = participants || [];
    const resolvedAssignments = assignments || [];

    // Map data for Split Engine
    const splitInput = {
      items: resolvedItems.map((item: any) => {
        // Find which participants this item is assigned to
        const assigned_to = resolvedAssignments
          .filter((a: any) => a.bill_item_id === item.id)
          .map((a: any) => a.participant_id);
        
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          assigned_to,
        };
      }),
      participants: resolvedParticipants.map((p: any) => ({
        id: p.id,
        name: p.name,
      })),
      tax: Number(bill?.tax || 0),
      tip: Number(bill?.tip || 0),
    };

    const split = calculateSplit(splitInput);

    return NextResponse.json({
      bill,
      items: resolvedItems,
      participants: resolvedParticipants,
      assignments: resolvedAssignments,
      split,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { supabase, bill, errorResponse } = await fetchAndCheckOwnership(id, req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    
    // update is conceptually same shape as create
    const parsed = createBillSchema.parse(body);

    // Update the bill's core fields
    const { data: updatedBill, error: updateError } = await supabase
      .from("bills")
      .update({
        title: parsed.title ?? bill!.title,
        date: parsed.date ?? bill!.date,
        tax: parsed.tax ?? bill!.tax,
        tip: parsed.tip ?? bill!.tip,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedBill) {
      return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
    }

    // PRD: "Replaces items, participants, and assignments entirely"
    // Delete existing. cascade will drop item_assignments automatically.
    await supabase.from("bill_items").delete().eq("bill_id", id);
    await supabase.from("participants").delete().eq("bill_id", id);

    // Re-insert exactly like POST
    let insertedItems: any[] = [];
    let insertedParticipants: any[] = [];
    let assignmentsToInsert: any[] = [];

    if (parsed.items && parsed.items.length > 0) {
      const { data } = await supabase.from("bill_items").insert(
        parsed.items.map(item => ({
          bill_id: id,
          name: item.name,
          price: item.price,
          is_ai_parsed: item.is_ai_parsed || false,
        }))
      ).select();
      insertedItems = data || [];
    }

    if (parsed.participants && parsed.participants.length > 0) {
      const { data } = await supabase.from("participants").insert(
        parsed.participants.map(p => ({
          bill_id: id,
          name: p.name,
        }))
      ).select();
      insertedParticipants = data || [];
    }

    if (parsed.assignments && parsed.assignments.length > 0 && insertedItems.length > 0 && insertedParticipants.length > 0) {
      assignmentsToInsert = parsed.assignments.map(a => {
        const item = insertedItems[a.item_index];
        const participant = insertedParticipants[a.participant_index];
        if (!item || !participant) throw new Error("Invalid assignment index");

        return {
          bill_item_id: item.id,
          participant_id: participant.id,
        };
      });

      if (assignmentsToInsert.length > 0) {
        await supabase.from("item_assignments").insert(assignmentsToInsert);
      }
    }

    // Rather than returning immediately, just call the GET handler effectively, or reconstruct.
    // For perf, reconstruct it since we have all data locally:
    const splitInput = {
      items: insertedItems.map((item: any) => {
        const assigned_to = assignmentsToInsert
          .filter((a: any) => a.bill_item_id === item.id)
          .map((a: any) => a.participant_id);
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          assigned_to,
        };
      }),
      participants: insertedParticipants.map((p: any) => ({
        id: p.id,
        name: p.name,
      })),
      tax: Number(updatedBill.tax),
      tip: Number(updatedBill.tip),
    };

    const split = calculateSplit(splitInput);

    return NextResponse.json({
      bill: updatedBill,
      items: insertedItems,
      participants: insertedParticipants,
      assignments: assignmentsToInsert,
      split,
    }, { status: 200 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { supabase, errorResponse } = await fetchAndCheckOwnership(id, req);
    if (errorResponse) return errorResponse;

    const { error: deleteError } = await supabase.from("bills").delete().eq("id", id);
    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

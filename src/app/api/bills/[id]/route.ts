import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateSplit } from "@/lib/split-engine";
import { createBillSchema } from "@/lib/validators"; // The Update schema is the same shape
import { z } from "zod";
import { BillItem, Participant, ItemAssignment, SplitInput } from "@/types";

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
async function fetchAndCheckOwnership(id: string, _req: NextRequest) {
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

export async function GET(_req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
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
        const itemIds = (itemData as { id: string }[] | null)?.map(i => i.id) || [];
        if (itemIds.length === 0) return { data: [] };
        return supabase.from("item_assignments").select("*").in("bill_item_id", itemIds);
      })
    ]);

    const resolvedItems = (items as BillItem[] | null) || [];
    const resolvedParticipants = (participants as Participant[] | null) || [];
    const resolvedAssignments = (assignments as ItemAssignment[] | null) || [];

    // Map data for Split Engine
    const splitInput: SplitInput = {
      items: resolvedItems.map((item) => {
        // Find which participants this item is assigned to
        const assigned_to = resolvedAssignments
          .filter((a) => a.bill_item_id === item.id)
          .map((a) => a.participant_id);
        
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          assigned_to,
        };
      }),
      participants: resolvedParticipants.map((p) => ({
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
    console.error("GET Bill Error:", error);
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
    let insertedItems: BillItem[] = [];
    let insertedParticipants: Participant[] = [];
    let assignmentsToInsert: { bill_item_id: string; participant_id: string }[] = [];

    if (parsed.items && parsed.items.length > 0) {
      const { data } = await supabase.from("bill_items").insert(
        parsed.items.map(item => ({
          bill_id: id,
          name: item.name,
          price: item.price,
          is_ai_parsed: item.is_ai_parsed || false,
        }))
      ).select();
      insertedItems = (data as BillItem[] | null) || [];
    }

    if (parsed.participants && parsed.participants.length > 0) {
      const { data } = await supabase.from("participants").insert(
        parsed.participants.map(p => ({
          bill_id: id,
          name: p.name,
        }))
      ).select();
      insertedParticipants = (data as Participant[] | null) || [];
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

    // Reconstruct split input to get final split
    const splitInput: SplitInput = {
      items: insertedItems.map((item) => {
        const assigned_to = assignmentsToInsert
          .filter((a) => a.bill_item_id === item.id)
          .map((a) => a.participant_id);
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          assigned_to,
        };
      }),
      participants: insertedParticipants.map((p) => ({
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

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("PUT Bill Error:", error);
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

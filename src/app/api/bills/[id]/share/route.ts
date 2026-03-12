import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateSplit } from "@/lib/split-engine";
import {
  BillItem,
  Participant,
  ItemAssignment,
  SplitInput,
  ShareItemDetail,
  SharePersonSplit,
  ShareResponse,
} from "@/types";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const supabase = await getSupabase();

    // Fetch bill (public — no auth check)
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .single();

    if (billError || !bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Fetch related data in parallel
    const [{ data: items }, { data: participants }, { data: assignments }] =
      await Promise.all([
        supabase.from("bill_items").select("*").eq("bill_id", id),
        supabase.from("participants").select("*").eq("bill_id", id),
        supabase
          .from("bill_items")
          .select("id")
          .eq("bill_id", id)
          .then(async ({ data: itemData }) => {
            const itemIds =
              (itemData as { id: string }[] | null)?.map((i) => i.id) || [];
            if (itemIds.length === 0) return { data: [] };
            return supabase
              .from("item_assignments")
              .select("*")
              .in("bill_item_id", itemIds);
          }),
      ]);

    const resolvedItems = (items as BillItem[] | null) || [];
    const resolvedParticipants = (participants as Participant[] | null) || [];
    const resolvedAssignments =
      (assignments as ItemAssignment[] | null) || [];

    // Build split input
    const splitInput: SplitInput = {
      items: resolvedItems.map((item) => {
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
      tax: Number(bill.tax || 0),
      tip: Number(bill.tip || 0),
    };

    const splitResult = calculateSplit(splitInput);

    // Build per-person item breakdowns
    const perPersonWithItems: SharePersonSplit[] = splitResult.per_person.map(
      (person) => {
        const personItems: ShareItemDetail[] = [];

        for (const item of splitInput.items) {
          const assignedIds =
            item.assigned_to.length > 0
              ? item.assigned_to
              : splitInput.participants.map((p) => p.id);

          if (assignedIds.includes(person.participant_id)) {
            personItems.push({
              name: item.name,
              price: item.price / assignedIds.length,
              shared_with: assignedIds.length,
            });
          }
        }

        return {
          ...person,
          items: personItems,
        };
      }
    );

    const response: ShareResponse = {
      title: bill.title,
      date: bill.date,
      split: {
        per_person: perPersonWithItems,
        subtotal: splitResult.subtotal,
        tax: splitResult.tax,
        tip: splitResult.tip,
        total: splitResult.total,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("GET Share Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

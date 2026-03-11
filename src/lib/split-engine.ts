import { SplitInput, SplitResult, PersonSplit } from "../types";

// Helper to reliably round numbers to 2 decimal places (e.g. 1.005 -> 1.01)
function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateSplit(input: SplitInput): SplitResult {
  const { items, participants, tax, tip } = input;

  // Edge case: No participants or no items doesn't make much sense but handled safely
  if (participants.length === 0) {
    return { per_person: [], subtotal: 0, tax: 0, tip: 0, total: 0 };
  }

  if (items.length === 0) {
    return {
      per_person: participants.map((p) => ({
        participant_id: p.id,
        participant_name: p.name,
        items_subtotal: 0,
        tax_share: 0,
        tip_share: 0,
        total: 0,
      })),
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
    };
  }

  // 1. Initialize result structure
  const splits = new Map<string, PersonSplit>();
  for (const p of participants) {
    splits.set(p.id, {
      participant_id: p.id,
      participant_name: p.name,
      items_subtotal: 0,
      tax_share: 0,
      tip_share: 0,
      total: 0,
    });
  }

  let subtotal = 0;

  // 2. Assign items to participants
  for (const item of items) {
    subtotal += item.price;

    const assignedIds = item.assigned_to.length > 0
      ? item.assigned_to
      : participants.map((p) => p.id); // Empty = shared by all

    // Only assign to participants that actually exist in the current bill context
    const validAssignedIds = assignedIds.filter((id) => splits.has(id));

    if (validAssignedIds.length === 0) continue;

    const splitPrice = item.price / validAssignedIds.length;

    for (const id of validAssignedIds) {
      splits.get(id)!.items_subtotal += splitPrice;
    }
  }

  // Sort helper to break tiebreakers for remainder cents: highest subtotal first, then alphabetical
  const getSortedPersons = () => {
    return Array.from(splits.values()).sort((a, b) => {
      if (b.items_subtotal !== a.items_subtotal) {
        return b.items_subtotal - a.items_subtotal; // Descending
      }
      return a.participant_name.localeCompare(b.participant_name); // Ascending alphabetical tiebreaker
    });
  };

  // Helper to distribute rounding remainders cents
  const distributeRemainder = (
    field: "items_subtotal" | "tax_share" | "tip_share",
    remainder: number
  ) => {
    let currentRemainder = round2(remainder);
    if (currentRemainder === 0) return;

    const sorted = getSortedPersons();
    
    // Distribute 1 cent round robin until remainder is 0
    while (Math.abs(currentRemainder) >= 0.01) {
      for (const p of sorted) {
        if (currentRemainder > 0) {
          p[field] = round2(p[field] + 0.01);
          currentRemainder = round2(currentRemainder - 0.01);
        } else if (currentRemainder < 0) {
          p[field] = round2(p[field] - 0.01);
          currentRemainder = round2(currentRemainder + 0.01);
        }
        if (currentRemainder === 0) break;
      }
    }
  };

  // Step 3-7: Distribute remainders for items_subtotal and calculate/distribute tax and tip
  let currentItemsSubtotalSum = 0;

  for (const person of splits.values()) {
    person.items_subtotal = round2(person.items_subtotal);
    currentItemsSubtotalSum += person.items_subtotal;
  }
  
  distributeRemainder("items_subtotal", subtotal - currentItemsSubtotalSum);

  // 4 & 5. Proportional tax and tip calculation based on items subtotal ratio
  let currentTaxSum = 0;
  let currentTipSum = 0;

  for (const person of splits.values()) {
    let ratio = 0;
    if (subtotal > 0) {
      ratio = person.items_subtotal / subtotal;
    } else {
      // If subtotal is $0 (items exist but cost $0), divide evenly to be fair
      ratio = 1 / participants.length;
    }

    person.tax_share = round2(tax * ratio);
    currentTaxSum += person.tax_share;

    person.tip_share = round2(tip * ratio);
    currentTipSum += person.tip_share;
  }

  distributeRemainder("tax_share", tax - currentTaxSum);
  distributeRemainder("tip_share", tip - currentTipSum);

  // 8. Final calculation for totals
  for (const person of splits.values()) {
    person.total = round2(person.items_subtotal + person.tax_share + person.tip_share);
  }

  return {
    per_person: Array.from(splits.values()),
    subtotal: round2(subtotal),
    tax: round2(tax),
    tip: round2(tip),
    total: round2(subtotal + tax + tip),
  };
}

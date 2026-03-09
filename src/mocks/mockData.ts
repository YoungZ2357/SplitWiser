import type { BillDetail, Bill, BillItem, Participant, ItemAssignment, SplitResult, PersonSplit } from "@/types";

/* ── Dashboard bill metadata — must stay in sync with dashboard page.tsx ── */

export interface MockBillMeta {
    title: string;
    date: string;
    total: number;
    participant_count: number;
}

const BILL_META: Record<string, MockBillMeta> = {
    "1": { title: "Costco Run", date: "2026-03-05", total: 87.43, participant_count: 3 },
    "2": { title: "Team Lunch — Shake Shack", date: "2026-03-03", total: 62.18, participant_count: 4 },
    "3": { title: "Grocery Split", date: "2026-02-28", total: 134.56, participant_count: 2 },
    "4": { title: "Dinner at Olive Garden", date: "2026-02-25", total: 98.70, participant_count: 5 },
    "5": { title: "Movie Night Snacks", date: "2026-02-22", total: 23.40, participant_count: 3 },
    "6": { title: "Weekend BBQ", date: "2026-02-18", total: 156.22, participant_count: 6 },
};

const PARTICIPANT_NAMES = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];

/* ── Factory function ── */

interface BillDetailOverrides {
    title?: string;
    date?: string;
    tax?: number;
    tip?: number;
    participant_count?: number;
}

export function createMockBillDetail(
    id: string,
    overrides: BillDetailOverrides = {},
): BillDetail {
    const meta = BILL_META[id];
    const title = overrides.title ?? meta?.title ?? `Bill ${id}`;
    const date = overrides.date ?? meta?.date ?? "2026-03-01";
    const tax = overrides.tax ?? 5.0;
    const tip = overrides.tip ?? 0;
    const pCount = overrides.participant_count ?? meta?.participant_count ?? 2;

    const ts = `${date}T10:00:00Z`;

    // Generate participants
    const participants: Participant[] = Array.from({ length: pCount }, (_, i) => ({
        id: `p${id}-${i + 1}`,
        bill_id: id,
        name: PARTICIPANT_NAMES[i % PARTICIPANT_NAMES.length],
        created_at: ts,
    }));

    // Generate 3 items with prices roughly summing to (total - tax - tip)
    const totalFromMeta = meta?.total ?? 50;
    const subtotal = +(totalFromMeta - tax - tip).toFixed(2);
    const prices = [
        +(subtotal * 0.4).toFixed(2),
        +(subtotal * 0.35).toFixed(2),
        +(subtotal - +(subtotal * 0.4).toFixed(2) - +(subtotal * 0.35).toFixed(2)).toFixed(2),
    ];
    const itemNames = ["Item A", "Item B", "Item C"];

    const items: BillItem[] = itemNames.map((name, i) => ({
        id: `item${id}-${i + 1}`,
        bill_id: id,
        name,
        price: prices[i],
        is_ai_parsed: false,
        created_at: ts,
    }));

    // Assign all items to all participants
    const assignments: ItemAssignment[] = items.flatMap((item) =>
        participants.map((p, pi) => ({
            id: `a${id}-${item.id}-${pi}`,
            bill_item_id: item.id,
            participant_id: p.id,
        })),
    );

    // Compute split: equal share since all items assigned to everyone
    const perPerson: PersonSplit[] = participants.map((p) => {
        const itemsSubtotal = +(subtotal / pCount).toFixed(2);
        const taxShare = +(tax / pCount).toFixed(2);
        const tipShare = +(tip / pCount).toFixed(2);
        return {
            participant_id: p.id,
            participant_name: p.name,
            items_subtotal: itemsSubtotal,
            tax_share: taxShare,
            tip_share: tipShare,
            total: +(itemsSubtotal + taxShare + tipShare).toFixed(2),
        };
    });

    const bill: Bill = {
        id,
        user_id: "user-123",
        title,
        date,
        tax,
        tip,
        receipt_image_url: null,
        created_at: ts,
        updated_at: ts,
    };

    const split: SplitResult = {
        per_person: perPerson,
        subtotal,
        tax,
        tip,
        total: +(subtotal + tax + tip).toFixed(2),
    };

    return { bill, items, participants, assignments, split };
}

/* ── Explicit override for id "1" to maintain test compatibility ── */

const bill1Override: BillDetail = {
    bill: {
        id: "1",
        user_id: "user-123",
        title: "Costco Run",
        date: "2026-03-05",
        tax: 8.5,
        tip: 0,
        receipt_image_url: null,
        created_at: "2026-03-05T10:00:00Z",
        updated_at: "2026-03-05T10:00:00Z",
    },
    items: [
        { id: "item-1", bill_id: "1", name: "Milk", price: 4.99, is_ai_parsed: false, created_at: "2026-03-05T10:00:00Z" },
        { id: "item-2", bill_id: "1", name: "Protein Bars", price: 12.99, is_ai_parsed: false, created_at: "2026-03-05T10:00:00Z" },
        { id: "item-3", bill_id: "1", name: "Organic Granola", price: 8.49, is_ai_parsed: false, created_at: "2026-03-05T10:00:00Z" },
    ],
    participants: [
        { id: "p-1", bill_id: "1", name: "Alice", created_at: "2026-03-05T10:00:00Z" },
        { id: "p-2", bill_id: "1", name: "Bob", created_at: "2026-03-05T10:00:00Z" },
        { id: "p-3", bill_id: "1", name: "Charlie", created_at: "2026-03-05T10:00:00Z" },
    ],
    assignments: [
        { id: "a-1", bill_item_id: "item-1", participant_id: "p-1" },
        { id: "a-2", bill_item_id: "item-1", participant_id: "p-2" },
        { id: "a-3", bill_item_id: "item-1", participant_id: "p-3" },
        { id: "a-4", bill_item_id: "item-2", participant_id: "p-1" },
        { id: "a-5", bill_item_id: "item-3", participant_id: "p-2" },
    ],
    split: {
        per_person: [
            { participant_id: "p-1", participant_name: "Alice", items_subtotal: 14.65, tax_share: 4.7, tip_share: 0, total: 19.35 },
            { participant_id: "p-2", participant_name: "Bob", items_subtotal: 10.15, tax_share: 3.26, tip_share: 0, total: 13.41 },
            { participant_id: "p-3", participant_name: "Charlie", items_subtotal: 1.66, tax_share: 0.54, tip_share: 0, total: 2.2 },
        ],
        subtotal: 26.47,
        tax: 8.5,
        tip: 0,
        total: 34.97,
    },
};

/* ── Pre-built map of all mock bill details ── */

export const mockBillDetails = new Map<string, BillDetail>(
    ["1", "2", "3", "4", "5", "6"].map((id) => [
        id,
        id === "1" ? bill1Override : createMockBillDetail(id),
    ]),
);

/** Convenience: the bill-list items matching GET /api/bills (PRD §5.2) */
export const mockBillsList = Object.entries(BILL_META).map(([id, meta]) => ({
    id,
    title: meta.title,
    date: meta.date,
    total: meta.total,
    participant_count: meta.participant_count,
    created_at: `${meta.date}T10:00:00Z`,
}));

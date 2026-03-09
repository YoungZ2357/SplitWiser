import { http, HttpResponse } from "msw";

/* ── Mock data matching PRD API response shapes ── */

/** GET /api/bills response items (PRD §5.2) */
const mockBillsList = [
    { id: "1", title: "Costco Run", date: "2026-03-05", total: 87.43, participant_count: 3, created_at: "2026-03-05T10:00:00Z" },
    { id: "2", title: "Team Lunch — Shake Shack", date: "2026-03-03", total: 62.18, participant_count: 4, created_at: "2026-03-03T12:30:00Z" },
    { id: "3", title: "Grocery Split", date: "2026-02-28", total: 134.56, participant_count: 2, created_at: "2026-02-28T09:00:00Z" },
];

/** GET /api/bills/:id response (PRD §5.2 — BillDetail) */
const mockBillDetail = {
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

/** POST /api/receipts/parse response (PRD §5.3) */
const mockParsedReceipt = {
    items: [
        { name: "Whole Milk 1gal", price: 4.99, confidence: "high" as const },
        { name: "Org Granola", price: 8.49, confidence: "medium" as const },
        { name: "PROT BAR 12PK", price: 12.99, confidence: "high" as const },
    ],
};

/* ── Handlers ── */

export const handlers = [
    /** GET /api/bills — list bills with pagination (PRD §5.2) */
    http.get("/api/bills", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const start = (page - 1) * limit;
        const paged = mockBillsList.slice(start, start + limit);

        return HttpResponse.json({
            bills: paged,
            pagination: {
                page,
                limit,
                total: mockBillsList.length,
            },
        });
    }),

    /** GET /api/bills/:id — bill detail (PRD §5.2) */
    http.get("/api/bills/:id", ({ params }) => {
        const { id } = params;
        if (id === mockBillDetail.bill.id) {
            return HttpResponse.json(mockBillDetail);
        }
        return new HttpResponse(null, { status: 404 });
    }),

    /** POST /api/bills — create bill (PRD §5.2) */
    http.post("/api/bills", async ({ request }) => {
        const body = await request.json();
        // Return a mock BillDetail with generated id
        return HttpResponse.json(
            { ...mockBillDetail, bill: { ...mockBillDetail.bill, id: "new-bill-id", ...(body as object) } },
            { status: 201 },
        );
    }),

    /** PUT /api/bills/:id — update bill (PRD §5.2) */
    http.put("/api/bills/:id", async ({ params }) => {
        const { id } = params;
        if (id === mockBillDetail.bill.id) {
            return HttpResponse.json(mockBillDetail);
        }
        return new HttpResponse(null, { status: 404 });
    }),

    /** DELETE /api/bills/:id (PRD §5.2) */
    http.delete("/api/bills/:id", ({ params }) => {
        const { id } = params;
        if (id === mockBillDetail.bill.id) {
            return new HttpResponse(null, { status: 204 });
        }
        return new HttpResponse(null, { status: 404 });
    }),

    /** POST /api/receipts/parse — receipt parsing (PRD §5.3) */
    http.post("/api/receipts/parse", () => {
        return HttpResponse.json(mockParsedReceipt);
    }),

    /** GET /api/bills/:id/share — public share (PRD §5.4) */
    http.get("/api/bills/:id/share", ({ params }) => {
        const { id } = params;
        if (id === mockBillDetail.bill.id) {
            return HttpResponse.json({
                title: mockBillDetail.bill.title,
                date: mockBillDetail.bill.date,
                split: mockBillDetail.split,
            });
        }
        return new HttpResponse(null, { status: 404 });
    }),
];
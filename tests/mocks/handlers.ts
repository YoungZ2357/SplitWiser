import { http, HttpResponse } from "msw";
import { mockBillDetails, mockBillsList } from "@/mocks/mockData";

/* ── Mock data for receipt parsing (not shared with browser) ── */

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
        const detail = mockBillDetails.get(params.id as string);
        if (detail) {
            return HttpResponse.json(detail);
        }
        return new HttpResponse(null, { status: 404 });
    }),

    /** POST /api/bills — create bill (PRD §5.2) */
    http.post("/api/bills", async ({ request }) => {
        const body = await request.json();
        const bill1 = mockBillDetails.get("1")!;
        return HttpResponse.json(
            { ...bill1, bill: { ...bill1.bill, id: "new-bill-id", ...(body as object) } },
            { status: 201 },
        );
    }),

    /** PUT /api/bills/:id — update bill (PRD §5.2) */
    http.put("/api/bills/:id", async ({ params }) => {
        const detail = mockBillDetails.get(params.id as string);
        if (detail) {
            return HttpResponse.json(detail);
        }
        return new HttpResponse(null, { status: 404 });
    }),

    /** DELETE /api/bills/:id (PRD §5.2) */
    http.delete("/api/bills/:id", ({ params }) => {
        if (mockBillDetails.has(params.id as string)) {
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
        const detail = mockBillDetails.get(params.id as string);
        if (detail) {
            return HttpResponse.json({
                title: detail.bill.title,
                date: detail.bill.date,
                split: detail.split,
            });
        }
        return new HttpResponse(null, { status: 404 });
    }),
];
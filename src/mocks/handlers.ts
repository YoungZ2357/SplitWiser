import { http, HttpResponse, delay } from "msw";
import { mockBillDetails, mockBillsList } from "./mockData";

/* ── Browser-side MSW handlers (dev server only) ── */

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
            pagination: { page, limit, total: mockBillsList.length },
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

    /** DELETE /api/bills/:id (PRD §5.2) */
    http.delete("/api/bills/:id", ({ params }) => {
        if (mockBillDetails.has(params.id as string)) {
            return new HttpResponse(null, { status: 204 });
        }
        return new HttpResponse(null, { status: 404 });
    }),

    /** POST /api/receipts/parse — mock receipt parsing (PRD §5.3) */
    http.post("/api/receipts/parse", async () => {
        // Simulate network and Gemini processing time
        await delay(Math.floor(Math.random() * 501) + 300); // 300-800ms random delay

        return HttpResponse.json({
            items: [
                { name: "WHOLE MILK 1GAL", price: 4.99, confidence: "high" },
                { name: "ORG GRANOLA 16OZ", price: 8.49, confidence: "medium" },
                { name: "PROT BAR 12PK", price: 12.99, confidence: "high" },
                { name: "BANAN 2LB", price: 1.29, confidence: "high" },
                { name: "CHKN BRST 3LB", price: 11.47, confidence: "high" },
                { name: "AVO HASS 4CT", price: 3.99, confidence: "medium" },
                { name: "SMTHNG UNCLEAR", price: 3.50, confidence: "low" },
                { name: "PAPER TOWEL 6R", price: 15.99, confidence: "high" },
            ],
            // In production, the backend stores the image in Supabase Storage
            // and returns the URL here. For mock, we omit it.
            receipt_image_url: null,
        });
    }),
];

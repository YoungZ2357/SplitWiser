import { http, HttpResponse } from "msw";
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

    /** POST /api/bills — create a new bill */
    http.post("/api/bills", () => {
        return HttpResponse.json({
            id: "new-bill-id",
            title: "Mocked New Bill",
            date: "2024-03-10",
        }, { status: 201 });
    }),

    /** POST /api/receipts/parse — mock receipt parsing (PRD §5.3) */
    http.post("/api/receipts/parse", async ({ request }) => {
        // Simulate Gemini processing time removed for speed

        // Validate that an image was provided
        const formData = await request.formData();
        const image = formData.get("image");

        if (!image || (typeof image === "object" && !("name" in image))) {
            return HttpResponse.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        // Return mock parsed items matching PRD §5.3 response shape
        return HttpResponse.json({
            items: [
                { name: "Whole Milk 1gal", price: 4.99, confidence: "high" },
                { name: "Org Granola", price: 8.49, confidence: "medium" },
                { name: "PROT BAR 12PK", price: 12.99, confidence: "high" },
                { name: "Bananas 2lb", price: 1.29, confidence: "high" },
                { name: "CHKN BRST", price: 9.87, confidence: "low" },
            ],
            // In production, the backend stores the image in Supabase Storage
            // and returns the URL here. For mock, we omit it — the frontend
            // already has the local blob URL for preview.
            receipt_image_url: null,
        });
    }),

    /** PUT /api/bills/:id — update existing bill */
    http.put("/api/bills/:id", () => {
        return HttpResponse.json({}, { status: 200 });
    }),
];
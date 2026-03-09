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
];

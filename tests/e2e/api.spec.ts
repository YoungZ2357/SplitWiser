import { test, expect } from "@playwright/test";

test.describe("Public API endpoints", () => {
  test("GET /api/bills/:id/share returns 404 for non-existent bill", async ({
    request,
  }) => {
    const res = await request.get("/api/bills/nonexistent-id/share");
    expect(res.status()).toBe(404);
  });

  test("POST /api/bills returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/bills", {
      data: { title: "Test", date: "2026-01-01", tax: 0, tip: 0, items: [], participants: [], assignments: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/bills/some-id returns 401 without auth", async ({
    request,
  }) => {
    const res = await request.delete("/api/bills/some-id");
    expect(res.status()).toBe(401);
  });

  test("POST /api/receipts/parse returns 401 without auth", async ({
    request,
  }) => {
    const res = await request.post("/api/receipts/parse");
    expect(res.status()).toBe(401);
  });
});

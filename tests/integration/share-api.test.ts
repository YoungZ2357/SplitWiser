import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../src/app/api/bills/[id]/share/route";

const mockSingle = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Complex Supabase client mock requires 'any' for chainable methods
      const chainable: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          if (table === "bills") return mockSingle();
          return Promise.resolve({ data: null, error: null });
        }),
        then: vi.fn().mockImplementation((onFulfilled) => {
          if (table === "bill_items") {
            return Promise.resolve({
              data: [
                { id: "item-1", bill_id: "bill-123", name: "Pizza", price: 20, is_ai_parsed: false },
                { id: "item-2", bill_id: "bill-123", name: "Salad", price: 10, is_ai_parsed: false },
              ],
              error: null,
            }).then(onFulfilled);
          }
          if (table === "participants") {
            return Promise.resolve({
              data: [
                { id: "p-1", bill_id: "bill-123", name: "Alice" },
                { id: "p-2", bill_id: "bill-123", name: "Bob" },
              ],
              error: null,
            }).then(onFulfilled);
          }
          if (table === "item_assignments") {
            return Promise.resolve({
              data: [
                { id: "a-1", bill_item_id: "item-1", participant_id: "p-1" },
                { id: "a-2", bill_item_id: "item-1", participant_id: "p-2" },
                { id: "a-3", bill_item_id: "item-2", participant_id: "p-1" },
              ],
              error: null,
            }).then(onFulfilled);
          }
          return Promise.resolve({ data: [], error: null }).then(onFulfilled);
        }),
      };

      if (table === "bills") {
        chainable.single = mockSingle;
      }

      return chainable;
    }),
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

describe("Share API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = { id: "bill-123" };

  it("GET returns 200 with correct share response shape", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "bill-123",
        user_id: "test-user-id",
        title: "Dinner",
        date: "2026-03-12",
        tax: 3,
        tip: 5,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/bills/bill-123/share");
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.title).toBe("Dinner");
    expect(body.date).toBe("2026-03-12");
    expect(body.split).toBeDefined();
    expect(body.split.per_person).toBeInstanceOf(Array);
    expect(body.split.per_person.length).toBe(2);
    expect(body.split.subtotal).toBe(30);
    expect(body.split.tax).toBe(3);
    expect(body.split.tip).toBe(5);
    expect(body.split.total).toBe(38);

    // Check per-person items
    const alice = body.split.per_person.find(
      (p: { participant_name: string }) => p.participant_name === "Alice"
    );
    expect(alice).toBeDefined();
    expect(alice.items).toBeInstanceOf(Array);
    expect(alice.items.length).toBe(2); // Pizza (shared) + Salad (solo)

    // Pizza shared by 2
    const pizzaItem = alice.items.find(
      (i: { name: string }) => i.name === "Pizza"
    );
    expect(pizzaItem.price).toBe(10); // 20 / 2
    expect(pizzaItem.shared_with).toBe(2);

    // Salad assigned only to Alice
    const saladItem = alice.items.find(
      (i: { name: string }) => i.name === "Salad"
    );
    expect(saladItem.price).toBe(10); // 10 / 1
    expect(saladItem.shared_with).toBe(1);
  });

  it("GET returns 404 for non-existent bill", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const req = new NextRequest(
      "http://localhost:3000/api/bills/nonexistent/share"
    );
    const res = await GET(req, { params: { id: "nonexistent" } });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Bill not found");
  });

  it("works without authentication (public endpoint)", async () => {
    // The mock has user: null — no auth. It should still return 200.
    mockSingle.mockResolvedValue({
      data: {
        id: "bill-123",
        user_id: "some-owner",
        title: "Lunch",
        date: "2026-03-10",
        tax: 0,
        tip: 0,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/bills/bill-123/share");
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
  });
});

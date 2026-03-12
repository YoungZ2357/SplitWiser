import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "../../src/app/api/bills/[id]/route";

const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      const chainable: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          if (table === "bills") return mockSingle();
          return Promise.resolve({ data: null, error: null });
        }),
        then: vi.fn().mockImplementation((onFullfilled) => {
          // Default for awaited calls like .select().eq()
          return Promise.resolve({ data: [], error: null }).then(onFullfilled);
        }),
      };
      
      if (table === "bills") {
        chainable.single = mockSingle;
        chainable.update = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: mockUpdate
        });
        chainable.delete = vi.fn().mockReturnValue({
           eq: mockDelete
        });
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

describe("Bill Detail API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = { id: "bill-123" };

  it("GET returns 200 on success", async () => {
    mockSingle.mockResolvedValue({ 
      data: { id: "bill-123", user_id: "test-user-id", tax: 0, tip: 0 }, 
      error: null 
    });
    const req = new NextRequest("http://localhost:3000/api/bills/bill-123");
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
  });

  it("GET returns 404 if bill not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    const req = new NextRequest("http://localhost:3000/api/bills/bill-123");
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("DELETE returns 403 if not the owner", async () => {
    mockSingle.mockResolvedValue({ data: { id: "bill-123", user_id: "other-user" }, error: null });
    const req = new NextRequest("http://localhost:3000/api/bills/bill-123", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(403);
  });

  it("DELETE returns 204 on success", async () => {
    mockSingle.mockResolvedValue({ data: { id: "bill-123", user_id: "test-user-id" }, error: null });
    mockDelete.mockResolvedValue({ error: null });
    const req = new NextRequest("http://localhost:3000/api/bills/bill-123", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(204);
  });

  it("PUT returns 200 on success", async () => {
    mockSingle.mockResolvedValue({ data: { id: "bill-123", user_id: "test-user-id" }, error: null });
    mockUpdate.mockResolvedValue({ data: { id: "bill-123", tax: 5, tip: 5 }, error: null });

    const req = new NextRequest("http://localhost:3000/api/bills/bill-123", {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated",
        date: "2026-03-12",
        tax: 5,
        tip: 5,
        items: [{ name: "Milk", price: 5 }],
        participants: [{ name: "Alice" }],
        assignments: [{ item_index: 0, participant_index: 0 }]
      })
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
  });

  it("PUT returns 400 on invalid body", async () => {
    mockSingle.mockResolvedValue({ data: { id: "bill-123", user_id: "test-user-id" }, error: null });
    const req = new NextRequest("http://localhost:3000/api/bills/bill-123", {
      method: "PUT",
      body: JSON.stringify({ title: "" }) 
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
  });
});

import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/receipts/parse/route";
import * as gemini from "@/lib/gemini";
import { ParsedReceiptItem } from "@/types";

// Mocks
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock("@/lib/gemini", () => ({
  parseReceiptImage: vi.fn(),
}));

describe("Receipt Parsing API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default success for auth
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
  });

  it("should parse a valid image successfully", async () => {
    // Mock storage success
    mockUpload.mockResolvedValue({ data: {}, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "http://example.com/receipt.jpg" } });
    
    // Mock Gemini success
    const mockItems: ParsedReceiptItem[] = [{ name: "Milk", price: 4.99, confidence: "high" }];
    vi.mocked(gemini.parseReceiptImage).mockResolvedValue({
      items: mockItems,
    });

    // Create form data with a fake file
    const formData = new FormData();
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    formData.append("image", blob, "receipt.jpg");

    const req = new NextRequest("http://localhost:3000/api/receipts/parse", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toEqual(mockItems);
    expect(json.receipt_image_url).toBe("http://example.com/receipt.jpg");
    expect(mockUpload).toHaveBeenCalled();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

    const req = new NextRequest("http://localhost:3000/api/receipts/parse", {
      method: "POST",
      body: new FormData(),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 for unsupported file types", async () => {
    const formData = new FormData();
    const blob = new Blob(["fake-pdf-data"], { type: "application/pdf" });
    formData.append("image", blob, "receipt.pdf");

    const req = new NextRequest("http://localhost:3000/api/receipts/parse", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Unsupported image format");
  });

  it("should return 422 if image is not a receipt", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "url" } });
    
    vi.mocked(gemini.parseReceiptImage).mockRejectedValue(new Error("NOT_A_RECEIPT"));

    const formData = new FormData();
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    formData.append("image", blob, "cat.jpg");

    const req = new NextRequest("http://localhost:3000/api/receipts/parse", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.error).toContain("not be parsed as a receipt");
  });

  it("should return 429 on Gemini rate limit", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "url" } });
    
    vi.mocked(gemini.parseReceiptImage).mockRejectedValue(new Error("RATE_LIMIT_HIT"));

    const formData = new FormData();
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    formData.append("image", blob, "receipt.jpg");

    const req = new NextRequest("http://localhost:3000/api/receipts/parse", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("rate limit exceeded");
  });

  it("should return 500 if storage upload fails", async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: "Storage error" } });

    const formData = new FormData();
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    formData.append("image", blob, "receipt.jpg");

    const req = new NextRequest("http://localhost:3000/api/receipts/parse", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain("Failed to upload image");
  });
});

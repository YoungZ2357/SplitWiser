import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseReceiptImage } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";

vi.mock("@google/generative-ai", () => {
  const generateContentMock = vi.fn();
  const getGenerativeModelMock = vi.fn(() => ({
    generateContent: generateContentMock,
  }));
  
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = getGenerativeModelMock;
    },
  };
});

describe("parseReceiptImage", () => {
  const mockImageBase64 = "base64data";
  const mockMimeType = "image/jpeg";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse valid receipt items successfully", async () => {
    const mockItems = [
      { name: "Milk", price: 4.99, confidence: "high" },
      { name: "Bread", price: 2.50, confidence: "medium" },
    ];

    const mockResponse = {
      response: {
        text: () => JSON.stringify(mockItems),
      },
    };

    const genAI = new GoogleGenerativeAI("key");
    const model = genAI.getGenerativeModel({ model: "model" });
    const generateContent = model.generateContent as unknown as { mockResolvedValue: (val: unknown) => void };
    generateContent.mockResolvedValue(mockResponse);

    const result = await parseReceiptImage(mockImageBase64, mockMimeType);

    expect(result.items).toEqual(mockItems);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("should handle 'not_a_receipt' error from Gemini", async () => {
    const mockResponse = {
      response: {
        text: () => JSON.stringify({ error: "not_a_receipt" }),
      },
    };

    const genAI = new GoogleGenerativeAI("key");
    const model = genAI.getGenerativeModel({ model: "model" });
    const generateContent = model.generateContent as unknown as { mockResolvedValue: (val: unknown) => void };
    generateContent.mockResolvedValue(mockResponse);

    await expect(parseReceiptImage(mockImageBase64, mockMimeType)).rejects.toThrow(
      "NOT_A_RECEIPT"
    );
  });

  it("should retry once on invalid JSON", async () => {
    const mockInvalidResponse = {
      response: {
        text: () => "invalid json",
      },
    };

    const mockValidItems = [{ name: "Milk", price: 4.99, confidence: "high" }];
    const mockValidResponse = {
      response: {
        text: () => JSON.stringify(mockValidItems),
      },
    };

    const genAI = new GoogleGenerativeAI("key");
    const model = genAI.getGenerativeModel({ model: "model" });
    const generateContent = model.generateContent as unknown as {
      mockResolvedValueOnce: (val: unknown) => { mockResolvedValueOnce: (val: unknown) => void };
    };
    
    // First call returns invalid, second returns valid
    generateContent
      .mockResolvedValueOnce(mockInvalidResponse)
      .mockResolvedValueOnce(mockValidResponse);

    const result = await parseReceiptImage(mockImageBase64, mockMimeType);

    expect(result.items).toEqual(mockValidItems);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("should throw error after retry fails", async () => {
    const mockInvalidResponse = {
      response: {
        text: () => "invalid json",
      },
    };

    const genAI = new GoogleGenerativeAI("key");
    const model = genAI.getGenerativeModel({ model: "model" });
    const generateContent = model.generateContent as unknown as { mockResolvedValue: (val: unknown) => void };
    
    generateContent.mockResolvedValue(mockInvalidResponse);

    await expect(parseReceiptImage(mockImageBase64, mockMimeType)).rejects.toThrow();
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("should handle rate limit error (429)", async () => {
    const rateLimitError = {
      status: 429,
    };

    const genAI = new GoogleGenerativeAI("key");
    const model = genAI.getGenerativeModel({ model: "model" });
    const generateContent = model.generateContent as unknown as { mockRejectedValue: (val: unknown) => void };
    generateContent.mockRejectedValue(rateLimitError);

    await expect(parseReceiptImage(mockImageBase64, mockMimeType)).rejects.toThrow(
      "RATE_LIMIT_HIT"
    );
  });
});

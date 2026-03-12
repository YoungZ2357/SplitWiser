import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { ParseReceiptResponse, ParsedReceiptItem } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-3.1-pro-preview";

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are a receipt parser. Extract every line item from this receipt image.

Return ONLY a JSON array. No other text. No markdown.

Each item should have:
- "name": the item name as shown on the receipt
- "price": the final price as a number (after any discounts)
- "confidence": "high" if clearly readable, "medium" if partially unclear, "low" if guessed

Rules:
- If a discount is applied on a separate line, subtract it from the item above
- If an item spans multiple lines, combine them into one entry
- Ignore subtotals, tax lines, and total lines
- Ignore payment method lines
- If the image is not a receipt, return: {"error": "not_a_receipt"}
`;

/**
 * Parses a receipt image using Gemini AI.
 * @param imageBase64 Base64 encoded image data
 * @param mimeType Mime type of the image (e.g., "image/jpeg")
 * @param retry Whether to retry once on invalid JSON
 */
export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string,
  retry = true
): Promise<ParseReceiptResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const imagePart: Part = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text().trim();

    // Remove potential markdown code blocks
    const jsonString = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");

    try {
      const parsed = JSON.parse(jsonString);

      if (parsed.error === "not_a_receipt") {
        throw new Error("NOT_A_RECEIPT");
      }

      if (!Array.isArray(parsed)) {
        throw new Error("INVALID_JSON_FORMAT");
      }

      return {
        items: parsed as ParsedReceiptItem[],
      };
    } catch (parseError) {
      if (retry) {
        console.log("Gemini returned invalid JSON, retrying with stricter prompt...");
        return parseReceiptImage(imageBase64, mimeType, false);
      }
      throw parseError;
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_A_RECEIPT") {
      throw error;
    }

    // Handle rate limiting (429) and other API errors
    const status = (error as { status?: number })?.status;
    if (status === 429) {
      throw new Error("RATE_LIMIT_HIT");
    }

    console.error("Gemini API Error:", error);
    throw new Error("GEMINI_API_FAILURE");
  }
}

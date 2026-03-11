# Instruction: Add Receipt Parse Mock Handler to Browser MSW

## Objective

Add a `POST /api/receipts/parse` mock handler to the **browser MSW setup** (`src/mocks/`) so that the receipt upload flow can be tested visually in the local dev environment (`npm run dev`). This enables end-to-end visual verification of:
- The ReceiptReview confirm flow
- The collapsed receipt summary after confirm
- The Items step side-by-side layout (desktop) and vertical stack (mobile)
- Confidence indicators (high / medium / low)

## Reference Documents

> Read these files before making changes:
>
> - [ ] `src/mocks/handlers.ts` — existing browser mock handlers and data factory pattern
> - [ ] `tests/mocks/handlers.ts` — reference for the `POST /api/receipts/parse` handler already used in tests
> - [ ] `src/types/index.ts` — `ParseReceiptResponse` and `ParsedReceiptItem` type definitions
> - [ ] PRD `prd_v2.md` §5.3 — `POST /api/receipts/parse` response contract

## Scope of Changes

### 1. Add Receipt Parse Handler

**File:** `src/mocks/handlers.ts`

Add a new `POST /api/receipts/parse` handler. Follow the existing data generation style in this file (rich, randomized data from a factory/pool — NOT the minimal deterministic data used in `tests/mocks`).

**Response shape** (must match `ParseReceiptResponse`):
```typescript
{
  items: ParsedReceiptItem[]  // { name: string; price: number; confidence: "high" | "medium" | "low" }
}
```

**Mock data requirements:**
- Return 6–10 items to simulate a realistic receipt
- Include a mix of all three confidence levels: majority `"high"`, a few `"medium"`, at least one `"low"`
- Item names should look like real receipt line items (abbreviated, uppercase, realistic prices)
- Add a small random delay (300–800ms) via `delay()` to simulate network + Gemini processing time

**Example handler structure:**
```typescript
import { http, HttpResponse, delay } from "msw";

http.post("/api/receipts/parse", async () => {
  await delay(500);  // simulate processing time

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
  });
})
```

If the existing handler file uses a factory or helper function pattern to generate data, follow that pattern instead of hardcoding. The key constraint is that all three confidence levels must be represented.

### 2. Verify Handler Registration

Confirm that the new handler is included in the `handlers` array exported from `src/mocks/handlers.ts`. The browser worker setup in `src/mocks/` should already pick it up automatically if it imports from this handlers array.

## Do NOT Modify

- `tests/mocks/handlers.ts` — the test mock already has its own minimal handler; do not change it
- `tests/mocks/server.ts` — Node.js test setup, unrelated
- Any component or page files
- The browser worker setup file (`src/mocks/browser.ts` or equivalent) — it should already import handlers from the same file

## Verification

1. Run `npm run dev`
2. Navigate to `/bills/new`
3. Select "Upload Receipt" and pick any image file
4. Confirm that after a brief delay (~500ms), parsed items appear in the ReceiptReview component with correct confidence indicators
5. Confirm parsed items → verify the Input Method step collapses to a compact summary
6. Open the Items step → verify the side-by-side layout renders on desktop (≥768px) and vertical stack on mobile (<768px)

## Future Cleanup Note

When the real `POST /api/receipts/parse` backend endpoint is deployed by Reghu, this mock handler should be removed from `src/mocks/handlers.ts` along with all other browser MSW mocks as part of the production cutover. No special cleanup is needed — removing the handler entry from the array is sufficient.
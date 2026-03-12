import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useParams: () => ({}),
    usePathname: () => "/bills/new",
}));

/* ── Mock window.confirm ── */
const mockConfirm = vi.fn();
Object.defineProperty(window, "confirm", { value: mockConfirm, writable: true });

import NewBillPage from "@/app/(dashboard)/bills/new/page";

/* ── Helpers ── */

/** Fill the form to a state ready for submission */
async function fillMinimumForm() {
    // Title
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Bill" } });

    // Select manual input method → auto-advances to Items section
    fireEvent.click(screen.getByTestId("input-method-manual"));

    // Add 2 items
    fireEvent.click(screen.getByTestId("add-item-button"));
    fireEvent.change(screen.getByTestId("item-name-0"), { target: { value: "Pizza" } });
    fireEvent.change(screen.getByTestId("item-price-0"), { target: { value: "12.50" } });

    fireEvent.click(screen.getByTestId("add-item-button"));
    fireEvent.change(screen.getByTestId("item-name-1"), { target: { value: "Soda" } });
    fireEvent.change(screen.getByTestId("item-price-1"), { target: { value: "3.00" } });

    // Go to Participants section
    fireEvent.click(screen.getByTestId("section-header-2"));

    // Add 2 participants
    const participantInput = screen.getByTestId("participant-name-input");
    fireEvent.change(participantInput, { target: { value: "Alice" } });
    fireEvent.click(screen.getByTestId("add-participant-button"));
    fireEvent.change(participantInput, { target: { value: "Bob" } });
    fireEvent.click(screen.getByTestId("add-participant-button"));
}

describe("New Bill Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        server.resetHandlers();
        mockConfirm.mockReturnValue(true);
    });

    // ── Basic Render ──

    it("renders page header 'New Bill'", () => {
        render(<NewBillPage />);
        expect(screen.getByRole("heading", { name: "New Bill" })).toBeInTheDocument();
    });

    it("renders all 5 accordion section headers", () => {
        render(<NewBillPage />);
        expect(screen.getByTestId("section-header-0")).toBeInTheDocument();
        expect(screen.getByTestId("section-header-1")).toBeInTheDocument();
        expect(screen.getByTestId("section-header-2")).toBeInTheDocument();
        expect(screen.getByTestId("section-header-3")).toBeInTheDocument();
        expect(screen.getByTestId("section-header-4")).toBeInTheDocument();
    });

    // ── Section 0: Input Method ──

    it("selects 'Manual Entry' and advances to Items step", () => {
        render(<NewBillPage />);
        // Step 0 starts expanded with the input method options visible
        fireEvent.click(screen.getByTestId("input-method-manual"));
        // Should auto-advance to step 1 (Items), which shows the add-item button
        expect(screen.getByTestId("add-item-button")).toBeInTheDocument();
    });

    // ── Section 1: Items ──

    it("adds and removes items", () => {
        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-manual"));

        // Add an item
        fireEvent.click(screen.getByTestId("add-item-button"));
        expect(screen.getByTestId("item-name-0")).toBeInTheDocument();

        // Add another
        fireEvent.click(screen.getByTestId("add-item-button"));
        expect(screen.getByTestId("item-name-1")).toBeInTheDocument();

        // Remove the first
        const removeButtons = screen.getAllByLabelText(/Remove/);
        fireEvent.click(removeButtons[0]);
        expect(screen.queryByTestId("item-name-1")).not.toBeInTheDocument();
    });

    it("edits item name and price", () => {
        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-manual"));
        fireEvent.click(screen.getByTestId("add-item-button"));

        const nameInput = screen.getByTestId("item-name-0");
        const priceInput = screen.getByTestId("item-price-0");

        fireEvent.change(nameInput, { target: { value: "Burger" } });
        fireEvent.change(priceInput, { target: { value: "9.99" } });

        expect(nameInput).toHaveValue("Burger");
        expect(priceInput).toHaveValue(9.99);
    });

    it("tax and tip inputs update subtotal display", () => {
        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-manual"));

        // Add item with a price
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-price-0"), { target: { value: "20.00" } });

        // Subtotal should show $20.00
        expect(screen.getByTestId("subtotal")).toHaveTextContent("$20.00");

        // Tax / Tip inputs should be present
        const taxInput = screen.getByTestId("tax-input");
        const tipInput = screen.getByTestId("tip-input");
        fireEvent.change(taxInput, { target: { value: "2.50" } });
        fireEvent.change(tipInput, { target: { value: "4.00" } });

        expect(taxInput).toHaveValue(2.5);
        expect(tipInput).toHaveValue(4);
    });

    // ── Receipt Review flow Layout verification ──

    it("manual input mode does NOT show receipt image", () => {
        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-manual"));
        fireEvent.click(screen.getByTestId("add-item-button"));
        expect(screen.queryByTestId("receipt-review-image")).not.toBeInTheDocument();
    });

    it("receipt review renders grid layout with image and items", async () => {
        // Setup MSW to return parsed items
        server.use(
            http.post("/api/receipts/parse", () => {
                return HttpResponse.json({
                    items: [{ name: "Salad", price: 15.00, confidence: "high" }],
                    receipt_image_url: "fake_url.jpg"
                });
            })
        );

        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-receipt"));

        // upload mock file
        const uploader = screen.getByTestId("receipt-file-input");
        const file = new File(["dummy content"], "receipt.png", { type: "image/png" });
        Object.defineProperty(uploader, "files", { value: [file] });
        fireEvent.change(uploader);

        // Scan the receipt
        fireEvent.click(screen.getByTestId("scan-receipt-button"));

        // Confirm the parsed items
        const confirmBtn = await screen.findByTestId("receipt-confirm-button");
        fireEvent.click(confirmBtn);

        // Items step should now display the image and the items
        expect(screen.getByTestId("receipt-review-image")).toBeInTheDocument();
        expect(await screen.findByDisplayValue("Salad", {}, { timeout: 2500 })).toBeInTheDocument();
        expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    });

    it("confidence indicators render for parsed items", async () => {
        // Setup MSW to return items with varying confidences
        server.use(
            http.post("/api/receipts/parse", () => {
                return HttpResponse.json({
                    items: [
                        { name: "Salad", price: 15.00, confidence: "low" },
                        { name: "Soup", price: 8.00, confidence: "medium" },
                    ],
                    receipt_image_url: "fake_url.jpg"
                });
            })
        );

        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-receipt"));

        const uploader = screen.getByTestId("receipt-file-input");
        const file = new File(["dummy content"], "receipt.png", { type: "image/png" });
        Object.defineProperty(uploader, "files", { value: [file] });
        fireEvent.change(uploader);

        fireEvent.click(screen.getByTestId("scan-receipt-button"));

        // The Confidence Badges should render in the ReceiptReview component before confirming
        expect(await screen.findByText("LOW")).toBeInTheDocument();
        expect(screen.getByText("MED")).toBeInTheDocument();

        // Confirm the parsed items
        fireEvent.click(screen.getByTestId("receipt-confirm-button"));

        // Both badges should persist in the Items step
        expect(screen.getByText("LOW")).toBeInTheDocument();
        expect(screen.getByText("MED")).toBeInTheDocument();
    });

    it("parse failure falls back to manual input layout", async () => {
        // Setup MSW to return an error (422)
        server.use(
            http.post("/api/receipts/parse", () => {
                return new HttpResponse(null, { status: 422 });
            })
        );

        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("input-method-receipt"));

        const uploader = screen.getByTestId("receipt-file-input");
        const file = new File(["dummy content"], "receipt.png", { type: "image/png" });
        Object.defineProperty(uploader, "files", { value: [file] });
        fireEvent.change(uploader);

        fireEvent.click(screen.getByTestId("scan-receipt-button"));

        // Expect an error text
        expect(await screen.findByTestId("receipt-upload-error", {}, { timeout: 2500 })).toHaveTextContent("Could not read this image. Please try a clearer photo.");

        // Switch to the Items tab
        fireEvent.click(screen.getByTestId("section-header-1"));

        // Ensure image does not render
        expect(screen.queryByTestId("receipt-review-image")).not.toBeInTheDocument();
    });

    // ── Section 2: Participants ──

    it("adds and removes participants", () => {
        render(<NewBillPage />);
        // Navigate to participants section
        fireEvent.click(screen.getByTestId("section-header-2"));

        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        expect(screen.getByText("Alice")).toBeInTheDocument();

        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        expect(screen.getByText("Bob")).toBeInTheDocument();

        // Remove Alice
        fireEvent.click(screen.getByLabelText("Remove Alice"));
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("enforces min 2 participants with a warning", () => {
        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("section-header-2"));

        // Warning visible with 0 participants
        expect(screen.getByTestId("min-participants-warning")).toBeInTheDocument();

        // Add one — warning still visible
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        expect(screen.getByTestId("min-participants-warning")).toBeInTheDocument();

        // Add second — warning disappears
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        expect(screen.queryByTestId("min-participants-warning")).not.toBeInTheDocument();
    });

    // ── Auto-assignment ──

    it("adding an item auto-assigns all existing participants", () => {
        render(<NewBillPage />);

        // Add participants first
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        // Add an item
        fireEvent.click(screen.getByTestId("section-header-1"));
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-name-0"), { target: { value: "Pizza" } });
        fireEvent.change(screen.getByTestId("item-price-0"), { target: { value: "10.00" } });

        // Check assignment — go to assignment section
        fireEvent.click(screen.getByTestId("section-header-3"));
        // Both should be assigned (chips active)
        const aliceChip = screen.getByTestId("assignment-chip-0-0");
        const bobChip = screen.getByTestId("assignment-chip-0-1");
        // Active chips have the accent border color
        expect(aliceChip).toBeInTheDocument();
        expect(bobChip).toBeInTheDocument();
    });

    it("adding a participant auto-assigns to all existing items", () => {
        render(<NewBillPage />);

        // Add item first
        fireEvent.click(screen.getByTestId("input-method-manual"));
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-name-0"), { target: { value: "Pizza" } });

        // Add participants
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        // Check assignment section
        fireEvent.click(screen.getByTestId("section-header-3"));
        expect(screen.getByTestId("assignment-chip-0-0")).toBeInTheDocument();
        expect(screen.getByTestId("assignment-chip-0-1")).toBeInTheDocument();
    });

    it("removing a participant cleans up all assignments", () => {
        render(<NewBillPage />);

        // Add participants
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Charlie" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        // Add item (auto assigned to all 3)
        fireEvent.click(screen.getByTestId("section-header-1"));
        fireEvent.click(screen.getByTestId("add-item-button"));

        // Remove Bob (index 1)
        fireEvent.click(screen.getByTestId("section-header-2"));
        fireEvent.click(screen.getByLabelText("Remove Bob"));

        // Check assignment — should only have Alice and Charlie
        fireEvent.click(screen.getByTestId("section-header-3"));
        expect(screen.getByTestId("assignment-chip-0-0")).toBeInTheDocument(); // Alice
        expect(screen.getByTestId("assignment-chip-0-1")).toBeInTheDocument(); // Charlie (remapped from 2→1)
        expect(screen.queryByTestId("assignment-chip-0-2")).not.toBeInTheDocument(); // no third
    });

    it("removing an item cleans up its assignment entry", () => {
        render(<NewBillPage />);

        // Add participant
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        // Add 2 items
        fireEvent.click(screen.getByTestId("section-header-1"));
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-name-0"), { target: { value: "Pizza" } });
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-name-1"), { target: { value: "Soda" } });

        // Remove first item (Pizza)
        const removeButtons = screen.getAllByLabelText(/Remove/);
        fireEvent.click(removeButtons[0]);

        // Check assignment — only Soda should remain (at index 0 now)
        fireEvent.click(screen.getByTestId("section-header-3"));
        expect(screen.getByText("Soda")).toBeInTheDocument();
        expect(screen.queryByText("Pizza")).not.toBeInTheDocument();
    });

    // ── Section 3: Assignment ──

    it("toggles individual assignment chips", () => {
        render(<NewBillPage />);

        // Setup: add participants + item
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        fireEvent.click(screen.getByTestId("section-header-1"));
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-price-0"), { target: { value: "10.00" } });

        // Go to assignment — both should be auto-assigned
        fireEvent.click(screen.getByTestId("section-header-3"));
        expect(screen.getByTestId("per-person-cost-0")).toHaveTextContent("$5.00");

        // Toggle off Bob
        fireEvent.click(screen.getByTestId("assignment-chip-0-1"));
        // Now only Alice, cost = $10/person
        expect(screen.getByTestId("per-person-cost-0")).toHaveTextContent("$10.00");
    });

    it("'Everyone' chip toggles all participants for an item", () => {
        render(<NewBillPage />);

        // Setup
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        fireEvent.click(screen.getByTestId("section-header-1"));
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-price-0"), { target: { value: "10.00" } });

        fireEvent.click(screen.getByTestId("section-header-3"));

        // Click "Everyone" to deselect all (since auto-assigned = all)
        fireEvent.click(screen.getByTestId("everyone-chip-0"));
        expect(screen.queryByTestId("per-person-cost-0")).not.toBeInTheDocument();

        // Click "Everyone" again to select all
        fireEvent.click(screen.getByTestId("everyone-chip-0"));
        expect(screen.getByTestId("per-person-cost-0")).toHaveTextContent("$5.00");
    });

    // ── Section 4: Review ──

    it("review section shows split summary with correct totals", async () => {
        render(<NewBillPage />);
        await fillMinimumForm();

        // Open Review
        fireEvent.click(screen.getByTestId("section-header-4"));

        // Grand total = 12.50 + 3.00 = 15.50
        expect(screen.getByTestId("grand-total")).toHaveTextContent("$15.50");
        // Both participants should be listed
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("review has 'Edit' links that jump to correct steps", async () => {
        render(<NewBillPage />);
        await fillMinimumForm();
        fireEvent.click(screen.getByTestId("section-header-4"));

        // Click "Items" edit link — should show Items section
        fireEvent.click(screen.getByTestId("review-edit-items"));
        expect(screen.getByTestId("add-item-button")).toBeInTheDocument();

        // Go back to review and click "Participants"
        fireEvent.click(screen.getByTestId("section-header-4"));
        fireEvent.click(screen.getByTestId("review-edit-participants"));
        expect(screen.getByTestId("add-participant-button")).toBeInTheDocument();

        // Go back to review and click "Assignments"
        fireEvent.click(screen.getByTestId("section-header-4"));
        fireEvent.click(screen.getByTestId("review-edit-assignments"));
        expect(screen.getByTestId("everyone-chip-0")).toBeInTheDocument();
    });

    it("all item prices $0 shows $0.00 split in Review", async () => {
        render(<NewBillPage />);

        // Set title
        fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Zero Bill" } });

        // Manual entry
        fireEvent.click(screen.getByTestId("input-method-manual"));

        // Add item with price 0
        fireEvent.click(screen.getByTestId("add-item-button"));
        fireEvent.change(screen.getByTestId("item-name-0"), { target: { value: "Free Item" } });
        // price defaults to 0

        // Add 2 participants
        fireEvent.click(screen.getByTestId("section-header-2"));
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        fireEvent.change(input, { target: { value: "Bob" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));

        // Open Review
        fireEvent.click(screen.getByTestId("section-header-4"));
        expect(screen.getByTestId("grand-total")).toHaveTextContent("$0.00");
    });

    // ── Submit ──

    it("submit posts CreateBillRequest and redirects on success", async () => {
        render(<NewBillPage />);
        await fillMinimumForm();

        fireEvent.click(screen.getByTestId("submit-button"));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/bills/new-bill-id");
        });
    });

    it("shows error on submit failure", async () => {
        server.use(
            http.post("/api/bills", () => {
                return new HttpResponse(null, { status: 400 });
            })
        );

        render(<NewBillPage />);
        await fillMinimumForm();

        fireEvent.click(screen.getByTestId("submit-button"));

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Failed to create bill");
        });
    });

    // ── Close button ──

    it("close (×) with unsaved changes shows confirm dialog", () => {
        render(<NewBillPage />);
        // Make the form dirty
        fireEvent.change(screen.getByTestId("title-input"), { target: { value: "My Bill" } });
        mockConfirm.mockReturnValue(false);

        fireEvent.click(screen.getByTestId("close-button"));

        expect(mockConfirm).toHaveBeenCalledWith("You have unsaved changes. Leave anyway?");
        // Should NOT navigate since confirm returned false
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("close (×) without changes navigates directly", () => {
        render(<NewBillPage />);
        fireEvent.click(screen.getByTestId("close-button"));
        expect(mockConfirm).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
});

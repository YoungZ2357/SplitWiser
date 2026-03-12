import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReceiptReview, { type ParsedItem } from "@/components/receipt/ReceiptReview";

const mockItems: ParsedItem[] = [
    { name: "Whole Milk", price: 4.99, confidence: "high" },
    { name: "Org Granola", price: 8.49, confidence: "medium" },
    { name: "CHKN BRST", price: 9.87, confidence: "low" },
];

describe("ReceiptReview", () => {
    const mockOnConfirm = vi.fn();
    const mockOnRetake = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders parsed items with names and prices", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        expect(screen.getByDisplayValue("Whole Milk")).toBeInTheDocument();
        expect(screen.getByDisplayValue("8.49")).toBeInTheDocument();
        expect(screen.getByDisplayValue("9.87")).toBeInTheDocument();
    });

    it("shows confidence warning for low/medium items", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        expect(screen.getByTestId("confidence-warning")).toHaveTextContent(
            "2 items may need review"
        );
        expect(screen.getByText("LOW")).toBeInTheDocument();
        expect(screen.getByText("MED")).toBeInTheDocument();
    });

    it("allows editing item name", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        const nameInput = screen.getByTestId("review-item-name-0");
        fireEvent.change(nameInput, { target: { value: "Skim Milk" } });
        expect(screen.getByDisplayValue("Skim Milk")).toBeInTheDocument();
    });

    it("allows editing item price", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        const priceInput = screen.getByTestId("review-item-price-0");
        fireEvent.change(priceInput, { target: { value: "5.99" } });
        expect(screen.getByDisplayValue("5.99")).toBeInTheDocument();
    });

    it("removes an item when remove button is clicked", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        const removeBtn = screen.getByLabelText("Remove Whole Milk");
        fireEvent.click(removeBtn);
        expect(screen.queryByDisplayValue("Whole Milk")).not.toBeInTheDocument();
        expect(screen.getByText("2 items")).toBeInTheDocument();
    });

    it("adds a new empty item", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        fireEvent.click(screen.getByTestId("review-add-item-button"));
        expect(screen.getByText("4 items")).toBeInTheDocument();
    });

    it("clears all items", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        fireEvent.click(screen.getByTestId("review-clear-all-button"));
        expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("disables confirm button when no items", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={[]}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        expect(screen.getByTestId("receipt-confirm-button")).toBeDisabled();
    });

    it("calls onConfirm with current items on confirm click", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        fireEvent.click(screen.getByTestId("receipt-confirm-button"));
        expect(mockOnConfirm).toHaveBeenCalledWith(mockItems);
    });

    it("calls onRetake on re-upload click", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        fireEvent.click(screen.getByTestId("receipt-retake-button"));
        expect(mockOnRetake).toHaveBeenCalled();
    });

    it("renders confirmed state when isConfirmed is true", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
                isConfirmed={true}
                confirmedCount={3}
            />
        );
        expect(screen.getByText("Receipt uploaded · 3 items parsed")).toBeInTheDocument();
    });

    it("renders confirmed state with singular item text", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
                isConfirmed={true}
                confirmedCount={1}
            />
        );
        expect(screen.getByText("Receipt uploaded · 1 item parsed")).toBeInTheDocument();
    });

    it("toggles receipt image visibility on mobile", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        const toggleBtn = screen.getByTestId("toggle-receipt-image");
        expect(toggleBtn).toHaveTextContent("View receipt");

        fireEvent.click(toggleBtn);
        expect(toggleBtn).toHaveTextContent("Hide receipt");

        fireEvent.click(toggleBtn);
        expect(toggleBtn).toHaveTextContent("View receipt");
    });

    it("shows subtotal calculation", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={mockItems}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        // 4.99 + 8.49 + 9.87 = 23.35
        expect(screen.getByText("Subtotal: $23.35")).toBeInTheDocument();
    });

    it("does not show CLEAR ALL when no items", () => {
        render(
            <ReceiptReview
                imageUrl="blob:receipt"
                parsedItems={[]}
                onConfirm={mockOnConfirm}
                onRetake={mockOnRetake}
            />
        );
        expect(screen.queryByTestId("review-clear-all-button")).not.toBeInTheDocument();
    });
});

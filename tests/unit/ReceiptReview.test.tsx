import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock utilities ──
vi.mock("@/lib/cn", () => ({
  cn: (...classes: (string | false | undefined | null)[]) =>
    classes.filter(Boolean).join(" "),
}));

vi.mock("@/lib/format", () => ({
  formatCurrency: (n: number) => "$" + n.toFixed(2),
}));

// ── Import component after mocks ──
import ReceiptReview, { ParsedItem } from "@/components/receipt/ReceiptReview";

describe("ReceiptReview", () => {
  const mockOnConfirm = vi.fn();
  const mockOnRetake = vi.fn();
  const defaultItems: ParsedItem[] = [
    { name: "Coffee", price: 4.5, confidence: "high" },
    { name: "Sandwich", price: 8.75, confidence: "medium" },
    { name: "Cookie", price: 2.25, confidence: "low" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial render ──
  it("renders receipt image and item list", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    expect(screen.getByTestId("receipt-review-image")).toHaveAttribute(
      "src",
      "https://example.com/receipt.jpg"
    );
    expect(screen.getByDisplayValue("Coffee")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sandwich")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8.75")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cookie")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2.25")).toBeInTheDocument();
  });

  // ── Confidence warnings ──
  it("shows confidence warning when low/medium confidence items exist", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const warning = screen.getByTestId("confidence-warning");
    expect(warning).toHaveTextContent("2 items may need review");
  });

  it("does not show confidence warning when all items have high confidence", () => {
    const highConfItems: ParsedItem[] = [
      { name: "Coffee", price: 4.5, confidence: "high" },
      { name: "Tea", price: 3.0, confidence: "high" },
    ];
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={highConfItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    expect(screen.queryByTestId("confidence-warning")).not.toBeInTheDocument();
  });

  // ── Confidence badges ──
  it("renders confidence badges for low/medium confidence items", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    expect(screen.getByText("MED")).toBeInTheDocument();
    expect(screen.getByText("LOW")).toBeInTheDocument();
  });

  it("does not render badge for high confidence items", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    expect(screen.queryByText("HIGH")).not.toBeInTheDocument();
  });

  // ── Item editing ──
  it("allows editing item name", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const nameInput = screen.getByDisplayValue("Coffee");
    fireEvent.change(nameInput, { target: { value: "Latte" } });
    expect(nameInput).toHaveValue("Latte");
  });

  it("allows editing item price", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const priceInput = screen.getByDisplayValue("4.5");
    fireEvent.change(priceInput, { target: { value: "5.25" } });
    expect(priceInput).toHaveValue(5.25);
  });

  // ── Item removal ──
  it("removes an item when delete button is clicked", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const deleteButtons = screen.getAllByRole("button", { name: /Remove/ });
    fireEvent.click(deleteButtons[0]); // Remove Coffee
    expect(screen.queryByDisplayValue("Coffee")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Sandwich")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cookie")).toBeInTheDocument();
  });

  // ── Add new item ──
  it("adds a new empty item when Add Item button is clicked", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const addButton = screen.getByTestId("review-add-item-button");
    // Count existing name inputs
    const initialNameInputs = screen.getAllByPlaceholderText("Item name");
    fireEvent.click(addButton);
    // After adding, there should be one more name input
    const nameInputs = screen.getAllByPlaceholderText("Item name");
    expect(nameInputs).toHaveLength(initialNameInputs.length + 1);
    // The newly added input should have empty value
    const newNameInput = nameInputs[nameInputs.length - 1];
    expect(newNameInput).toHaveValue("");
    // Similarly for price inputs
    const priceInputs = screen.getAllByPlaceholderText("0.00");
    const newPriceInput = priceInputs[priceInputs.length - 1];
    expect(newPriceInput).toHaveValue(null); // empty number input has null value
  });

  // ── Clear all items ──
  it("clears all items when CLEAR ALL is clicked", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const clearAllButton = screen.getByTestId("review-clear-all-button");
    fireEvent.click(clearAllButton);
    expect(screen.queryByDisplayValue("Coffee")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Sandwich")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Cookie")).not.toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  // ── Subtotal calculation ──
  it("calculates and displays subtotal correctly", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    expect(screen.getByText("Subtotal: $15.50")).toBeInTheDocument();
  });

  it("updates subtotal when items are edited", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const priceInput = screen.getByDisplayValue("4.5");
    fireEvent.change(priceInput, { target: { value: "6.0" } });
    expect(screen.getByText("Subtotal: $17.00")).toBeInTheDocument();
  });

  // ── Action buttons ──
  it("calls onRetake when Re-upload button is clicked", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const retakeButton = screen.getByTestId("receipt-retake-button");
    fireEvent.click(retakeButton);
    expect(mockOnRetake).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm with current items when confirm button is clicked", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const confirmButton = screen.getByTestId("receipt-confirm-button");
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledWith(defaultItems);
  });

  it("disables confirm button when no items are present", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={[]}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const confirmButton = screen.getByTestId("receipt-confirm-button");
    expect(confirmButton).toBeDisabled();
  });

  it("updates confirm button text when items are added or removed", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={[defaultItems[0]]}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    let confirmButton = screen.getByTestId("receipt-confirm-button");
    expect(confirmButton).toHaveTextContent("Use 1 Item");

    // Add two more items
    const addButton = screen.getByTestId("review-add-item-button");
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    confirmButton = screen.getByTestId("receipt-confirm-button");
    expect(confirmButton).toHaveTextContent("Use 3 Items");

    // Remove one item
    const deleteButtons = screen.getAllByRole("button", { name: /Remove/ });
    fireEvent.click(deleteButtons[0]);

    confirmButton = screen.getByTestId("receipt-confirm-button");
    expect(confirmButton).toHaveTextContent("Use 2 Items");
  });

  // ── Mobile image toggle ──
  it("toggles receipt image visibility on mobile", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
      />
    );
    const toggleButton = screen.getByTestId("toggle-receipt-image");
    expect(toggleButton).toHaveTextContent("View receipt");
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent("Hide receipt");
  });

  // ── Confirmed state ──
  it("renders confirmed state when isConfirmed is true", () => {
    render(
      <ReceiptReview
        imageUrl="https://example.com/receipt.jpg"
        parsedItems={defaultItems}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
        isConfirmed
        confirmedCount={3}
      />
    );
    expect(screen.getByText("Receipt uploaded · 3 items parsed")).toBeInTheDocument();
    expect(screen.getByAltText("Receipt")).toBeInTheDocument();
    expect(screen.queryByTestId("confidence-warning")).not.toBeInTheDocument();
    expect(screen.queryByTestId("receipt-confirm-button")).not.toBeInTheDocument();
  });
});

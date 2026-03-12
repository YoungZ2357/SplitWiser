import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BillRow, { type BillSummary } from "@/components/bill/BillRow";

/* ── Mock Icons ── */
vi.mock("@/lib/icons", async () => {
    const React = await import("react");
    return {
        Icons: {
            receipt: React.createElement("span", { "data-testid": "receipt-icon" }, "R"),
            calendar: React.createElement("span", { "data-testid": "calendar-icon" }, "C"),
            users: React.createElement("span", { "data-testid": "users-icon" }, "U"),
        },
    };
});

const mockBill: BillSummary = {
    id: "bill-1",
    title: "Test Bill",
    date: "2024-03-15",
    total: 45.99,
    participant_count: 3,
};

describe("BillRow", () => {
    it("renders bill title", () => {
        render(<BillRow bill={mockBill} />);
        expect(screen.getByText("Test Bill")).toBeInTheDocument();
    });

    it("renders formatted total", () => {
        render(<BillRow bill={mockBill} />);
        const totals = screen.getAllByText("$45.99");
        expect(totals.length).toBeGreaterThan(0);
    });

    it("renders participant count", () => {
        render(<BillRow bill={mockBill} />);
        expect(screen.getByText("3 people")).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
        const onClick = vi.fn();
        render(<BillRow bill={mockBill} onClick={onClick} />);
        fireEvent.click(screen.getByText("Test Bill"));
        expect(onClick).toHaveBeenCalled();
    });

    it("applies border class when showBorder is true", () => {
        const { container } = render(<BillRow bill={mockBill} showBorder={true} />);
        expect(container.firstElementChild?.className).toContain("border-b");
    });

    it("does not apply border class when showBorder is false", () => {
        const { container } = render(<BillRow bill={mockBill} showBorder={false} />);
        expect(container.firstElementChild?.className).not.toContain("border-b");
    });

    it("changes background on mouse enter and leave", () => {
        const { container } = render(<BillRow bill={mockBill} />);
        const row = container.firstElementChild!;

        fireEvent.mouseEnter(row);
        expect(row.className).toContain("bg-surface-alt");

        fireEvent.mouseLeave(row);
        expect(row.className).toContain("bg-transparent");
    });
});

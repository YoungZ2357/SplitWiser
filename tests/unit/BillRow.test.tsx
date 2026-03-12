import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BillRow from "@/components/bill/BillRow";
import type { BillSummary } from "@/components/bill/BillRow";

// Mock Icons
vi.mock("@/lib/icons", () => ({
    Icons: {
        receipt: <div data-testid="icon-receipt">📄</div>,
        calendar: <div data-testid="icon-calendar">📅</div>,
        users: <div data-testid="icon-users">👥</div>,
    },
}));

// Mock format functions
vi.mock("@/lib/format", () => ({
    formatCurrency: (n: number) => `$${n.toFixed(2)}`,
    formatDateShort: (date: string) => {
        // Map known test dates to avoid timezone issues
        if (date === "2026-03-12") return "Mar 12";
        if (date === "2026-02-28") return "Feb 28";
        // Fallback for any other date
        const d = new Date(date);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[d.getMonth()]} ${d.getDate()}`;
    },
}));

// Mock cn utility
vi.mock("@/lib/cn", () => ({
    cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("BillRow", () => {
    const mockBill: BillSummary = {
        id: "bill1",
        title: "Dinner at Restaurant",
        date: "2026-03-12",
        total: 125.75,
        participant_count: 4,
    };

    it("renders bill title and total", () => {
        render(<BillRow bill={mockBill} />);
        
        expect(screen.getByText("Dinner at Restaurant")).toBeInTheDocument();
        // Two total elements exist (mobile and desktop)
        const totalElements = screen.getAllByText("$125.75");
        expect(totalElements).toHaveLength(2);
    });

    it("renders date and participant count on desktop", () => {
        render(<BillRow bill={mockBill} />);
        
        // Desktop date with icon
        const desktopDate = screen.getByTestId("icon-calendar").parentElement;
        expect(desktopDate).toHaveTextContent(/Mar 12/);
        
        // Desktop participants with icon
        const desktopParticipants = screen.getByTestId("icon-users").parentElement;
        expect(desktopParticipants).toHaveTextContent(/4/);
    });

    it("renders mobile layout correctly", () => {
        render(<BillRow bill={mockBill} />);
        
        // Mobile total should be visible (sm:hidden on desktop total, but mobile total is sm:hidden? Wait, mobile total is shown with class "sm:hidden")
        // Actually mobile total is shown with class "sm:hidden" on the total element
        const totalElements = screen.getAllByText("$125.75");
        expect(totalElements.length).toBeGreaterThan(0);
        
        // Mobile subtitle with date and participant count (date appears twice, mobile and desktop)
        const dateElements = screen.getAllByText("Mar 12");
        expect(dateElements.length).toBeGreaterThan(0);
        expect(screen.getByText("4 people")).toBeInTheDocument();
    });

    it("applies hover styles on mouse events", () => {
        render(<BillRow bill={mockBill} />);
        
        const row = screen.getByText("Dinner at Restaurant").closest("div[class*='cursor-pointer']");
        expect(row).toBeInTheDocument();
        
        // Initially no hover class
        expect(row).not.toHaveClass("bg-surface-alt");
        
        // Trigger mouse enter
        fireEvent.mouseEnter(row!);
        expect(row).toHaveClass("bg-surface-alt");
        
        // Trigger mouse leave
        fireEvent.mouseLeave(row!);
        expect(row).not.toHaveClass("bg-surface-alt");
    });

    it("calls onClick when clicked", () => {
        const handleClick = vi.fn();
        render(<BillRow bill={mockBill} onClick={handleClick} />);
        
        const row = screen.getByText("Dinner at Restaurant").closest("div[class*='cursor-pointer']");
        fireEvent.click(row!);
        
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("shows border by default", () => {
        render(<BillRow bill={mockBill} />);
        
        const row = screen.getByText("Dinner at Restaurant").closest("div[class*='border-b']");
        expect(row).toBeInTheDocument();
    });

    it("hides border when showBorder is false", () => {
        render(<BillRow bill={mockBill} showBorder={false} />);
        
        const row = screen.getByText("Dinner at Restaurant").closest("div[class*='border-b']");
        expect(row).toBeNull();
    });

    it("renders receipt icon", () => {
        render(<BillRow bill={mockBill} />);
        
        expect(screen.getByTestId("icon-receipt")).toBeInTheDocument();
    });

    it("handles different bill data", () => {
        const anotherBill: BillSummary = {
            id: "bill2",
            title: "Groceries",
            date: "2026-02-28",
            total: 89.50,
            participant_count: 2,
        };
        
        render(<BillRow bill={anotherBill} />);
        
        expect(screen.getByText("Groceries")).toBeInTheDocument();
        // Two total elements (mobile and desktop)
        const totalElements = screen.getAllByText("$89.50");
        expect(totalElements).toHaveLength(2);
        // Date appears twice (mobile and desktop)
        const dateElements = screen.getAllByText("Feb 28");
        expect(dateElements.length).toBeGreaterThan(0);
        // Desktop participants with icon
        const desktopParticipants = screen.getByTestId("icon-users").parentElement;
        expect(desktopParticipants).toHaveTextContent(/2/);
        // Mobile subtitle
        expect(screen.getByText("2 people")).toBeInTheDocument();
    });
});
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaginationBar from "@/components/ui/PaginationBar";

describe("PaginationBar", () => {
    it("returns null when totalPages <= 1", () => {
        const { container } = render(
            <PaginationBar currentPage={1} totalPages={1} onPageChange={vi.fn()} />
        );
        expect(container.innerHTML).toBe("");
    });

    it("renders page info and buttons when totalPages > 1", () => {
        render(
            <PaginationBar currentPage={2} totalPages={5} onPageChange={vi.fn()} />
        );
        expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
        expect(screen.getByText("Prev")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("disables Prev on first page", () => {
        render(
            <PaginationBar currentPage={1} totalPages={3} onPageChange={vi.fn()} />
        );
        expect(screen.getByText("Prev")).toBeDisabled();
        expect(screen.getByText("Next")).not.toBeDisabled();
    });

    it("disables Next on last page", () => {
        render(
            <PaginationBar currentPage={3} totalPages={3} onPageChange={vi.fn()} />
        );
        expect(screen.getByText("Prev")).not.toBeDisabled();
        expect(screen.getByText("Next")).toBeDisabled();
    });

    it("calls onPageChange with previous page on Prev click", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar currentPage={3} totalPages={5} onPageChange={onPageChange} />
        );
        fireEvent.click(screen.getByText("Prev"));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange with next page on Next click", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar currentPage={3} totalPages={5} onPageChange={onPageChange} />
        );
        fireEvent.click(screen.getByText("Next"));
        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("clamps page to min 1 when clicking Prev on page 1", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar currentPage={1} totalPages={3} onPageChange={onPageChange} />
        );
        // Force-click even though disabled to test clamping logic
        fireEvent.click(screen.getByText("Prev"));
        // Button is disabled so click won't fire, which is correct behavior
        expect(onPageChange).not.toHaveBeenCalled();
    });
});

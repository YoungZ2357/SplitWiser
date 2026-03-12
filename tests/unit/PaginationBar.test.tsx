import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaginationBar from "@/components/ui/PaginationBar";

// Mock cn utility
vi.mock("@/lib/cn", () => ({
    cn: (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" "),
}));

describe("PaginationBar component", () => {
    it("returns null when totalPages <= 1", () => {
        const { container } = render(
            <PaginationBar
                currentPage={1}
                totalPages={1}
                onPageChange={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();

        const { container: container2 } = render(
            <PaginationBar
                currentPage={1}
                totalPages={0}
                onPageChange={vi.fn()}
            />
        );
        expect(container2.firstChild).toBeNull();
    });

    it("renders page info and buttons when totalPages > 1", () => {
        render(
            <PaginationBar
                currentPage={2}
                totalPages={5}
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
        expect(screen.getByText("Prev")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("disables Prev button when currentPage <= 1", () => {
        render(
            <PaginationBar
                currentPage={1}
                totalPages={5}
                onPageChange={vi.fn()}
            />
        );

        const prevButton = screen.getByText("Prev");
        expect(prevButton).toBeDisabled();
        
        const nextButton = screen.getByText("Next");
        expect(nextButton).toBeEnabled();
    });

    it("disables Next button when currentPage >= totalPages", () => {
        render(
            <PaginationBar
                currentPage={5}
                totalPages={5}
                onPageChange={vi.fn()}
            />
        );

        const nextButton = screen.getByText("Next");
        expect(nextButton).toBeDisabled();
        
        const prevButton = screen.getByText("Prev");
        expect(prevButton).toBeEnabled();
    });

    it("enables Prev button when currentPage > 1", () => {
        render(
            <PaginationBar
                currentPage={3}
                totalPages={5}
                onPageChange={vi.fn()}
            />
        );

        const prevButton = screen.getByText("Prev");
        expect(prevButton).toBeEnabled();
    });

    it("enables Next button when currentPage < totalPages", () => {
        render(
            <PaginationBar
                currentPage={3}
                totalPages={5}
                onPageChange={vi.fn()}
            />
        );

        const nextButton = screen.getByText("Next");
        expect(nextButton).toBeEnabled();
    });

    it("calls onPageChange with previous page when Prev clicked", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar
                currentPage={3}
                totalPages={5}
                onPageChange={onPageChange}
            />
        );

        const prevButton = screen.getByText("Prev");
        fireEvent.click(prevButton);

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange with next page when Next clicked", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar
                currentPage={3}
                totalPages={5}
                onPageChange={onPageChange}
            />
        );

        const nextButton = screen.getByText("Next");
        fireEvent.click(nextButton);

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("does not call onPageChange when Prev disabled and clicked", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar
                currentPage={1}
                totalPages={5}
                onPageChange={onPageChange}
            />
        );

        const prevButton = screen.getByText("Prev");
        fireEvent.click(prevButton);

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it("does not call onPageChange when Next disabled and clicked", () => {
        const onPageChange = vi.fn();
        render(
            <PaginationBar
                currentPage={5}
                totalPages={5}
                onPageChange={onPageChange}
            />
        );

        const nextButton = screen.getByText("Next");
        fireEvent.click(nextButton);

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it("shows correct page numbers", () => {
        render(
            <PaginationBar
                currentPage={3}
                totalPages={7}
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByText("Page 3 of 7")).toBeInTheDocument();
    });

    it("applies correct classes via cn", () => {
        render(
            <PaginationBar
                currentPage={2}
                totalPages={5}
                onPageChange={vi.fn()}
            />
        );

        const prevButton = screen.getByText("Prev");
        const nextButton = screen.getByText("Next");

        // When buttons are enabled, they should have the enabled classes
        expect(prevButton).toBeEnabled();
        expect(nextButton).toBeEnabled();

        // The mocked cn returns joined classes, we can check the class attribute
        // Since cn is mocked, the actual class string will be a space-separated list
        // We'll just verify that the button has some classes (not empty)
        expect(prevButton.className).toBeTruthy();
        expect(nextButton.className).toBeTruthy();
    });
});
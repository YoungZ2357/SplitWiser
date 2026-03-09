import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

/**
 * Integration test for the Dashboard page.
 *
 * NOTE: The current page.tsx uses hardcoded mock data (MOCK_BILLS),
 * not actual fetch calls to /api/bills. These tests validate the
 * component composition and rendering logic.
 *
 * When page.tsx is updated to fetch from GET /api/bills,
 * uncomment the MSW override tests below — they will intercept
 * the real fetch calls and return controlled responses.
 */

// For now, we import and render the page component directly.
// The mock data is embedded in the component.
import DashboardPage from "@/app/(dashboard)/dashboard/page";

describe("Dashboard Page — populated state", () => {
    it("renders the page heading", () => {
        render(<DashboardPage />);
        expect(screen.getByText("Your Bills")).toBeInTheDocument();
    });

    it("renders bill count", () => {
        render(<DashboardPage />);
        expect(screen.getByText("6 bills total")).toBeInTheDocument();
    });

    it("renders table column headers", () => {
        render(<DashboardPage />);
        expect(screen.getByText("Bill")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("People")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("renders all mock bill titles", () => {
        render(<DashboardPage />);
        expect(screen.getByText("Costco Run")).toBeInTheDocument();
        expect(screen.getByText("Team Lunch — Shake Shack")).toBeInTheDocument();
        expect(screen.getByText("Grocery Split")).toBeInTheDocument();
        expect(screen.getByText("Weekend BBQ")).toBeInTheDocument();
    });

    it("does not show empty state when bills exist", () => {
        render(<DashboardPage />);
        expect(screen.queryByText("No bills yet")).not.toBeInTheDocument();
    });
});

describe("Dashboard Page — navigation", () => {
    it("navigates to bill detail when a bill row is clicked", () => {
        mockPush.mockClear();
        render(<DashboardPage />);
        // Click the first bill (Costco Run)
        const costcoRow = screen.getByText("Costco Run");
        fireEvent.click(costcoRow);
        expect(mockPush).toHaveBeenCalledWith("/bills/1");
    });

    it("navigates to correct bill id for each row", () => {
        mockPush.mockClear();
        render(<DashboardPage />);
        const groceryRow = screen.getByText("Grocery Split");
        fireEvent.click(groceryRow);
        expect(mockPush).toHaveBeenCalledWith("/bills/3");
    });
});
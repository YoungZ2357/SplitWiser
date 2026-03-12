import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
const mockRouter = { push: mockPush };
vi.mock("next/navigation", () => ({
    useRouter: () => mockRouter,
    usePathname: () => "/dashboard",
}));

/**
 * Integration test for the Dashboard page.
 * Validates the component composition and rendering logic using MSW to mock API responses.
 */

describe("Dashboard Page — populated state", () => {
    it("renders the page heading", async () => {
        render(<DashboardPage />);
        expect(await screen.findByText("Your Bills")).toBeInTheDocument();
    });

    it("renders bill count from mockData.ts", async () => {
        render(<DashboardPage />);
        // Match "2 bill(s) total" case-insensitively.
        expect(await screen.findByText(/2 bills? total/i)).toBeInTheDocument();
    });

    it("renders table column headers", async () => {
        render(<DashboardPage />);
        // Only rendered after bills are loaded
        expect(await screen.findByText("Bill")).toBeInTheDocument();
        expect(await screen.findByText("Date")).toBeInTheDocument();
        expect(await screen.findByText("People")).toBeInTheDocument();
        expect(await screen.findByText("Total")).toBeInTheDocument();
    });

    it("renders mock bill titles from mockData.ts", async () => {
        render(<DashboardPage />);
        // mockData.ts titles: "Dinner at John's", "Groceries"
        expect(await screen.findByText("Dinner at John's")).toBeInTheDocument();
        expect(await screen.findByText("Groceries")).toBeInTheDocument();
    });

    it("does not show empty state when bills exist", async () => {
        render(<DashboardPage />);
        await screen.findByText("Your Bills");
        expect(screen.queryByText("No bills yet")).not.toBeInTheDocument();
    });
});

describe("Dashboard Page — navigation", () => {
    it("navigates to bill detail when a bill row is clicked", async () => {
        mockPush.mockClear();
        render(<DashboardPage />);
        const billRow = await screen.findByText("Dinner at John's");
        fireEvent.click(billRow);
        expect(mockPush).toHaveBeenCalledWith("/bills/bill-1");
    });

    it("navigates to correct bill id for second row", async () => {
        mockPush.mockClear();
        render(<DashboardPage />);
        const groceryRow = await screen.findByText("Groceries");
        fireEvent.click(groceryRow);
        expect(mockPush).toHaveBeenCalledWith("/bills/bill-2");
    });
});

describe("Dashboard Page — empty state", () => {
    it("renders empty state when no bills are returned", async () => {
        // Override MSW handler for this test
        server.use(
            http.get("/api/bills", () => {
                return HttpResponse.json({
                    bills: [],
                    pagination: { page: 1, limit: 20, total: 0 },
                });
            })
        );

        render(<DashboardPage />);
        expect(await screen.findByText("No bills yet")).toBeInTheDocument();
        expect(screen.getByText(/Create your first bill/i)).toBeInTheDocument();
    });
});

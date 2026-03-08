import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

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

/**
 * TODO: Uncomment when page.tsx fetches from GET /api/bills
 *
 * describe("Dashboard Page — empty state via MSW", () => {
 *   it("shows empty state when API returns no bills", async () => {
 *     server.use(
 *       http.get("/api/bills", () => {
 *         return HttpResponse.json({
 *           bills: [],
 *           pagination: { page: 1, limit: 20, total: 0 },
 *         });
 *       })
 *     );
 *
 *     render(<DashboardPage />);
 *     expect(await screen.findByText("No bills yet")).toBeInTheDocument();
 *     expect(screen.getByText("Create a Bill")).toBeInTheDocument();
 *     expect(screen.getByText("Upload Receipt")).toBeInTheDocument();
 *   });
 *
 *   it("shows bills when API returns data", async () => {
 *     // Uses default handler from handlers.ts
 *     render(<DashboardPage />);
 *     expect(await screen.findByText("Costco Run")).toBeInTheDocument();
 *   });
 *
 *   it("shows error state on API failure", async () => {
 *     server.use(
 *       http.get("/api/bills", () => {
 *         return new HttpResponse(null, { status: 500 });
 *       })
 *     );
 *
 *     render(<DashboardPage />);
 *     // TODO: assert error UI once ErrorMessage component is implemented
 *   });
 * });
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

/* ── Mock Icons ── */
vi.mock("@/lib/icons", () => ({
    Icons: {
        spinner: <span>Spinner</span>,
        emptyReceipt: <span>EmptyReceipt</span>,
        plus: <span>+</span>,
        camera: <span>Camera</span>,
        receipt: <span>Receipt</span>,
        calendar: <span>Cal</span>,
        users: <span>Users</span>,
    },
}));

/* ── Mock DashboardShell ── */
vi.mock("@/components/layout/DashboardShell", () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import DashboardPage from "@/app/(dashboard)/dashboard/page";

describe("DashboardPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        server.resetHandlers();
    });

    it("shows loading state initially", () => {
        render(<DashboardPage />);
        expect(screen.getByText("Spinner")).toBeInTheDocument();
    });

    it("renders bills after fetch", async () => {
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("Dinner at John's")).toBeInTheDocument();
        });
        expect(screen.getByText("Groceries")).toBeInTheDocument();
    });

    it("shows total count", async () => {
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("2 bills total")).toBeInTheDocument();
        });
    });

    it("navigates to bill detail on row click", async () => {
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("Dinner at John's")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Dinner at John's"));
        expect(mockPush).toHaveBeenCalledWith("/bills/bill-1");
    });

    it("shows empty state when no bills", async () => {
        server.use(
            http.get("/api/bills", () => {
                return HttpResponse.json({
                    bills: [],
                    pagination: { page: 1, limit: 20, total: 0 },
                });
            })
        );

        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("No bills yet")).toBeInTheDocument();
        });
    });

    it("redirects to login on 401", async () => {
        server.use(
            http.get("/api/bills", () => {
                return new HttpResponse(null, { status: 401 });
            })
        );

        render(<DashboardPage />);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/login");
        });
    });

    it("shows error state on fetch failure", async () => {
        server.use(
            http.get("/api/bills", () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("Failed to load bills")).toBeInTheDocument();
        });
    });

    it("shows singular bill count for 1 bill", async () => {
        server.use(
            http.get("/api/bills", () => {
                return HttpResponse.json({
                    bills: [{ id: "b1", title: "Only Bill", date: "2024-01-01", total: 10, participant_count: 1 }],
                    pagination: { page: 1, limit: 20, total: 1 },
                });
            })
        );

        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("1 bill total")).toBeInTheDocument();
        });
    });

    it("retries fetch on Try Again click", async () => {
        let callCount = 0;
        server.use(
            http.get("/api/bills", () => {
                callCount++;
                if (callCount === 1) {
                    return new HttpResponse(null, { status: 500 });
                }
                return HttpResponse.json({
                    bills: [{ id: "b1", title: "Retry Bill", date: "2024-01-01", total: 10, participant_count: 2 }],
                    pagination: { page: 1, limit: 20, total: 1 },
                });
            })
        );

        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText("Failed to load bills")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Try Again"));
        await waitFor(() => {
            expect(screen.getByText("Retry Bill")).toBeInTheDocument();
        });
    });
});

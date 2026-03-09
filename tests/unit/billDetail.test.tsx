import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
const mockId = "1"; // matches mockBillDetail in handlers.ts
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useParams: () => ({ id: mockId }),
}));

/* ── Mock clipboard ── */
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
});

import BillDetailPage from "@/app/(dashboard)/bills/[id]/page";

describe("Bill Detail Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        server.resetHandlers();
    });

    it("renders loading state initially", () => {
        render(<BillDetailPage />);
        expect(screen.getByRole("status")).toHaveTextContent("Loading bill");
    });

    it("renders bill title and date after fetch", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        // Date is formatted via formatDate
        expect(screen.getByText(/Mar/)).toBeInTheDocument();
    });

    it("renders summary strip values", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        // Total from mock: $34.97
        expect(screen.getByText("$34.97")).toBeInTheDocument();
        // Subtotal: $26.47
        expect(screen.getByText("$26.47")).toBeInTheDocument();
        // Tax: $8.50
        expect(screen.getByText("$8.50")).toBeInTheDocument();
    });

    it("shows split summary tab by default with participant names", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeInTheDocument();
        });
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("expands person card on click to show item breakdown", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeInTheDocument();
        });
        // Click on Alice's header
        const aliceHeader = screen.getByTestId("person-header-p-1");
        fireEvent.click(aliceHeader);
        // Check that Alice's detail panel is visible
        await waitFor(() => {
            expect(screen.getByTestId("person-detail-p-1")).toBeInTheDocument();
        });
        expect(screen.getByText("Items subtotal")).toBeInTheDocument();
        expect(screen.getByText("Tax share")).toBeInTheDocument();
    });

    it("switches to Items tab and shows item list", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        // Items tab should show count
        const itemsTab = screen.getByRole("button", { name: /Items \(3\)/ });
        fireEvent.click(itemsTab);
        await waitFor(() => {
            expect(screen.getByText("Milk")).toBeInTheDocument();
        });
        expect(screen.getByText("Protein Bars")).toBeInTheDocument();
        expect(screen.getByText("Organic Granola")).toBeInTheDocument();
    });

    it("switches to Assignments tab and shows matrix", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        const assignmentsTab = screen.getByRole("button", { name: "Assignments" });
        fireEvent.click(assignmentsTab);
        // Check matrix has participant column headers
        await waitFor(() => {
            // Table header "Item" should be present
            expect(screen.getByText("Item")).toBeInTheDocument();
        });
        // Check marks should be present
        const checks = screen.getAllByText("✓");
        expect(checks.length).toBeGreaterThan(0);
    });

    it("opens delete dialog on Delete click", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        // Find the desktop Delete button (there may be a mobile one too)
        const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(screen.getByText("Delete this bill?")).toBeInTheDocument();
        });
    });

    it("closes delete dialog on Cancel", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(screen.getByText("Delete this bill?")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await waitFor(() => {
            expect(screen.queryByText("Delete this bill?")).not.toBeInTheDocument();
        });
    });

    it("shows error state for 404", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 404 });
            })
        );
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Bill not found");
        });
    });

    it("redirects to /dashboard after successful delete", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(screen.getByText("Delete this bill?")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: "Delete Bill" }));
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("share button copies link to clipboard", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        const shareButtons = screen.getAllByRole("button", { name: /Share/i });
        fireEvent.click(shareButtons[0]);
        await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalled();
        });
        // Button should change to "Copied!"
        await waitFor(() => {
            expect(screen.getAllByRole("button", { name: /Copied/i }).length).toBeGreaterThan(0);
        });
    });

    it("shows forbidden error for 403", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 403 });
            })
        );
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(
                "You do not have permission to view this bill"
            );
        });
    });

    it("renders complete data after loading finishes", async () => {
        render(<BillDetailPage />);
        // Initially loading
        expect(screen.getByRole("status")).toBeInTheDocument();
        // Wait for loading to disappear and data to render
        await waitFor(() => {
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });
        // Verify all critical elements
        expect(screen.getByText("Costco Run")).toBeInTheDocument();
        expect(screen.getByText("$34.97")).toBeInTheDocument();
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("navigates back to dashboard when 'Back to Dashboard' is clicked", async () => {
        render(<BillDetailPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        const backLink = screen.getByText("Back to Dashboard");
        fireEvent.click(backLink);
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
});

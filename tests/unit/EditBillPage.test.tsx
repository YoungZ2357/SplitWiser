import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useParams: () => ({ id: "1" }),
}));

/* ── Mock BillForm ── */
vi.mock("@/components/bill/BillForm", () => ({
    default: ({ mode, billId, onSubmitSuccess }: { mode: string; billId: string; onSubmitSuccess: () => void }) => (
        <div data-testid="bill-form">
            <span data-testid="form-mode">{mode}</span>
            <span data-testid="form-bill-id">{billId}</span>
            <button onClick={onSubmitSuccess} data-testid="submit-button">Submit</button>
        </div>
    ),
    mapBillDetailToFormState: (data: unknown) => ({ mapped: true, data }),
}));

import EditBillPage from "@/app/(dashboard)/bills/[id]/edit/page";

describe("EditBillPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        server.resetHandlers();
    });

    it("shows loading state initially", () => {
        render(<EditBillPage />);
        expect(screen.getByRole("status")).toHaveTextContent("Loading bill");
    });

    it("renders BillForm in edit mode after fetch", async () => {
        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByTestId("bill-form")).toBeInTheDocument();
        });
        expect(screen.getByTestId("form-mode")).toHaveTextContent("edit");
        expect(screen.getByTestId("form-bill-id")).toHaveTextContent("1");
    });

    it("redirects to detail page on submit success", async () => {
        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByTestId("bill-form")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("submit-button"));
        expect(mockPush).toHaveBeenCalledWith("/bills/1");
    });

    it("shows error for 404", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 404 });
            })
        );

        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Bill not found");
        });
    });

    it("shows error for 403", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 403 });
            })
        );

        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(
                "You do not have permission to edit this bill"
            );
        });
    });

    it("shows error for server error", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Failed to load bill");
        });
    });

    it("shows network error", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return HttpResponse.error();
            })
        );

        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Network error");
        });
    });

    it("has back to detail button on error", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 404 });
            })
        );

        render(<EditBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Back to detail"));
        expect(mockPush).toHaveBeenCalledWith("/bills/1");
    });
});

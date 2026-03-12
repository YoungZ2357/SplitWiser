import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

/* ── Mock next/navigation ── */
vi.mock("next/navigation", () => ({
    useParams: () => ({ billId: "1" }),
}));

import ShareBillPage from "@/app/share/[billId]/page";

describe("ShareBillPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        server.resetHandlers();
    });

    it("shows loading state initially", () => {
        render(<ShareBillPage />);
        expect(screen.getByRole("status")).toHaveTextContent("Loading bill");
    });

    it("renders bill data after fetch", async () => {
        render(<ShareBillPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });
        // Summary values
        expect(screen.getByText("$34.97")).toBeInTheDocument();
        expect(screen.getByText("$26.47")).toBeInTheDocument();
        expect(screen.getByText("$8.50")).toBeInTheDocument();
    });

    it("shows split summary tab by default", async () => {
        render(<ShareBillPage />);
        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeInTheDocument();
        });
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("switches to Items tab", async () => {
        render(<ShareBillPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /Items \(3\)/ }));
        await waitFor(() => {
            expect(screen.getByText("Milk")).toBeInTheDocument();
        });
    });

    it("switches to Assignments tab", async () => {
        render(<ShareBillPage />);
        await waitFor(() => {
            expect(screen.getByText("Costco Run")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Assignments" }));
        await waitFor(() => {
            expect(screen.getByText("Item")).toBeInTheDocument();
        });
    });

    it("shows error for 404", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 404 });
            })
        );

        render(<ShareBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Bill not found");
        });
    });

    it("shows error for server error", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<ShareBillPage />);
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

        render(<ShareBillPage />);
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Network error");
        });
    });
});

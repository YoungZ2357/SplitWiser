import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useParams: () => ({ id: "test-bill-id" }),
    usePathname: () => "/bills/test-bill-id/edit",
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, "confirm", { value: mockConfirm, writable: true });

// Mock react-day-picker
vi.mock("react-day-picker", () => ({
    DayPicker: () => <div data-testid="day-picker">DayPicker</div>,
}));

// Mock date-fns
vi.mock("date-fns", () => ({
    format: (date: Date, formatStr: string) => {
        if (formatStr === "MMM d, yyyy") return "Mar 12, 2026";
        if (formatStr === "yyyy-MM-dd") return "2026-03-12";
        return date.toString();
    },
    parse: (str: string, _formatStr: string, _date: Date) => new Date(str),
}));

// Mock subcomponents used by BillForm
vi.mock("@/components/receipt/ReceiptUpload", () => ({
    default: ({ previewUrl, isParsing, error }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div data-testid="receipt-upload">
            {previewUrl &&   <img src={previewUrl} alt="preview" />}
            {isParsing && <span>Parsing...</span>}
            {error && <span>{error}</span>}
        </div>
    ),
}));

vi.mock("@/components/receipt/ReceiptReview", () => ({
    default: ({ imageUrl, parsedItems, isConfirmed: _isConfirmed, confirmedCount: _confirmedCount, onConfirm, onRetake }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div data-testid="receipt-review">
            { }<img src={imageUrl} alt="receipt" />
            <div>Items: {parsedItems?.length || 0}</div>
            <button onClick={() => onConfirm(parsedItems || [])}>Confirm</button>
            <button onClick={onRetake}>Retake</button>
        </div>
    ),
}));

vi.mock("@/components/receipt/ReceiptImage", () => ({
    default: ({ src, alt }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div data-testid="receipt-image">
            { }<img src={src} alt={alt} />
        </div>
    ),
}));

// Mock formatCurrency
vi.mock("@/lib/format", () => ({
    formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

// Mock cn utility
vi.mock("@/lib/cn", () => ({
    cn: (...classes: any[]) => classes.filter(Boolean).join(" "), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

import EditBillPage from "@/app/(dashboard)/bills/[id]/edit/page";

/* ── Helpers ── */

/** Verify the form is populated with existing bill data */
function verifyFormPopulated() {
    // Title should be pre-filled
    expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
    
    // Items count badge should show 3
    const itemsBadge = screen.getByTestId("section-header-1").querySelector('span.bg-surface-alt');
    expect(itemsBadge).toHaveTextContent("3");
    
    // Participants count badge should show 3
    const participantsBadge = screen.getByTestId("section-header-2").querySelector('span.bg-surface-alt');
    expect(participantsBadge).toHaveTextContent("3");
    
    // Expand items section to verify items
    fireEvent.click(screen.getByTestId("section-header-1"));
    expect(screen.getByDisplayValue("Milk")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4.99")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Protein Bars")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12.99")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Organic Granola")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8.49")).toBeInTheDocument();
    
    // Expand participants section
    fireEvent.click(screen.getByTestId("section-header-2"));
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
}

/** Modify some fields in the existing form */
async function modifyForm() {
    // Change title
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Updated Costco Run" } });
    
    // Navigate to items section
    fireEvent.click(screen.getByTestId("section-header-1"));
    
    // Update first item price
    fireEvent.change(screen.getByTestId("item-price-0"), { target: { value: "5.99" } });
    
    // Add a new item
    fireEvent.click(screen.getByTestId("add-item-button"));
    fireEvent.change(screen.getByTestId("item-name-3"), { target: { value: "Eggs" } });
    fireEvent.change(screen.getByTestId("item-price-3"), { target: { value: "3.99" } });
    
    // Navigate to participants section
    fireEvent.click(screen.getByTestId("section-header-2"));
    
    // Add a new participant
    const participantInput = screen.getByTestId("participant-name-input");
    fireEvent.change(participantInput, { target: { value: "David" } });
    fireEvent.click(screen.getByTestId("add-participant-button"));
}

describe("Edit Bill Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        server.resetHandlers();
        mockConfirm.mockReturnValue(true);
    });

    // ── Loading & Error States ──

    it("shows loading indicator while fetching bill", async () => {
        // Delay the response to see loading state
        server.use(
            http.get("/api/bills/:id", async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return HttpResponse.json({
                    bill: {
                        id: "test-bill-id",
                        title: "Costco Run",
                        date: "2024-03-10",
                        tax: 8.50,
                        tip: 0.00,
                        receipt_image_url: null,
                    },
                    items: [
                        { id: "i-1", name: "Milk", price: 4.99, is_ai_parsed: false },
                        { id: "i-2", name: "Protein Bars", price: 12.99, is_ai_parsed: false },
                        { id: "i-3", name: "Organic Granola", price: 8.49, is_ai_parsed: false },
                    ],
                    participants: [
                        { id: "p-1", name: "Alice" },
                        { id: "p-2", name: "Bob" },
                        { id: "p-3", name: "Charlie" },
                    ],
                    assignments: [
                        { bill_item_id: "i-1", participant_id: "p-1" },
                        { bill_item_id: "i-2", participant_id: "p-2" },
                        { bill_item_id: "i-3", participant_id: "p-3" },
                    ],
                    split: {
                        subtotal: 26.47,
                        tax: 8.50,
                        tip: 0,
                        total: 34.97,
                        per_person: []
                    },
                });
            })
        );

        render(<EditBillPage />);
        
        // Should show loading text
        expect(screen.getByText("Loading bill…")).toBeInTheDocument();
        
        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText("Loading bill…")).not.toBeInTheDocument();
        });
    });

    it("shows 404 error when bill not found", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 404 });
            })
        );

        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Bill not found.");
        });
        
        // Should show "Back to detail" button
        expect(screen.getByText("Back to detail")).toBeInTheDocument();
    });

    it("shows 403 error when no permission to edit", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 403 });
            })
        );

        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("You do not have permission to edit this bill.");
        });
    });

    it("shows network error on fetch failure", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Failed to load bill. Please try again.");
        });
    });

    it("shows generic error on fetch exception", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                throw new Error("Network error");
            })
        );

        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Failed to load bill. Please try again.");
        });
    });

    // ── Form Population ──

    it("populates form with existing bill data", async () => {
        render(<EditBillPage />);
        
        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByText("Edit Bill")).toBeInTheDocument();
        });
        
        // Verify form is populated with mock data
        verifyFormPopulated();
        
        // Should show edit mode title
        expect(screen.getByRole("heading", { name: "Edit Bill" })).toBeInTheDocument();
    });

    it("renders all 5 accordion section headers", async () => {
        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByTestId("section-header-0")).toBeInTheDocument();
            expect(screen.getByTestId("section-header-1")).toBeInTheDocument();
            expect(screen.getByTestId("section-header-2")).toBeInTheDocument();
            expect(screen.getByTestId("section-header-3")).toBeInTheDocument();
            expect(screen.getByTestId("section-header-4")).toBeInTheDocument();
        });
    });

    // ── Form Interactions ──

    it("allows editing title", async () => {
        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        const titleInput = screen.getByTestId("title-input");
        fireEvent.change(titleInput, { target: { value: "Updated Costco Run" } });
        
        expect(titleInput).toHaveValue("Updated Costco Run");
    });

    it("allows adding and removing items", async () => {
        render(<EditBillPage />);
        
        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Navigate to items section
        fireEvent.click(screen.getByTestId("section-header-1"));
        
        // Wait for items to appear
        await waitFor(() => {
            expect(screen.getByDisplayValue("Milk")).toBeInTheDocument();
        });
        
        // Add new item
        fireEvent.click(screen.getByTestId("add-item-button"));
        expect(screen.getByTestId("item-name-3")).toBeInTheDocument();
        
        // Remove an item
        const removeButtons = screen.getAllByLabelText(/Remove/);
        fireEvent.click(removeButtons[0]); // Remove Milk
        
        await waitFor(() => {
            expect(screen.queryByDisplayValue("Milk")).not.toBeInTheDocument();
        });
    });

    it("allows adding and removing participants", async () => {
        render(<EditBillPage />);
        
        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Navigate to participants section
        fireEvent.click(screen.getByTestId("section-header-2"));
        
        // Wait for participants to appear
        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeInTheDocument();
        });
        
        // Add new participant
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "David" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        
        expect(screen.getByText("David")).toBeInTheDocument();
        
        // Remove a participant
        fireEvent.click(screen.getByLabelText("Remove Bob"));
        
        await waitFor(() => {
            expect(screen.queryByText("Bob")).not.toBeInTheDocument();
        });
    });

    it("updates assignments when participants change", async () => {
        render(<EditBillPage />);
        
        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Go to participants section and add a new participant
        fireEvent.click(screen.getByTestId("section-header-2"));
        
        // Wait for participants to appear
        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeInTheDocument();
        });
        
        const input = screen.getByTestId("participant-name-input");
        fireEvent.change(input, { target: { value: "David" } });
        fireEvent.click(screen.getByTestId("add-participant-button"));
        
        // Go to assignment section to verify new participant is auto-assigned
        fireEvent.click(screen.getByTestId("section-header-3"));
        
        // New participant should be in assignment chips
        expect(screen.getByTestId("assignment-chip-0-3")).toBeInTheDocument(); // David at index 3
    });

    // ── Submit Flow ──

    it("submits PUT request and redirects on success", async () => {
        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Modify the form
        await modifyForm();
        
        // Submit the form
        fireEvent.click(screen.getByTestId("submit-button"));
        
        // Should call PUT to /api/bills/test-bill-id
        // Redirects to bill detail page on success
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/bills/test-bill-id");
        });
    });

    it("shows error on submit failure", async () => {
        // Mock PUT failure
        server.use(
            http.put("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 400 });
            })
        );

        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Modify and submit
        await modifyForm();
        fireEvent.click(screen.getByTestId("submit-button"));
        
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Failed to update bill. Please try again.");
        });
    });

    // ── Navigation & Unsaved Changes ──

    it("close button with unsaved changes shows confirm dialog", async () => {
        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Make a change
        const titleInput = screen.getByTestId("title-input");
        fireEvent.change(titleInput, { target: { value: "Changed Title" } });
        
        mockConfirm.mockReturnValue(false); // User says "Cancel"
        
        // Click close button
        fireEvent.click(screen.getByTestId("close-button"));
        
        expect(mockConfirm).toHaveBeenCalledWith("You have unsaved changes. Leave anyway?");
        expect(mockPush).not.toHaveBeenCalled(); // Should not navigate
    });

    it("close button without unsaved changes navigates directly", async () => {
        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue("Costco Run")).toBeInTheDocument();
        });
        
        // Click close without making changes
        fireEvent.click(screen.getByTestId("close-button"));
        
        expect(mockConfirm).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("back to detail link works in error state", async () => {
        server.use(
            http.get("/api/bills/:id", () => {
                return new HttpResponse(null, { status: 404 });
            })
        );

        render(<EditBillPage />);
        
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
        
        // Click "Back to detail" button
        fireEvent.click(screen.getByText("Back to detail"));
        
        expect(mockPush).toHaveBeenCalledWith("/bills/test-bill-id");
    });
});
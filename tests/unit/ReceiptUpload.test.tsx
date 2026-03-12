import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReceiptUpload from "@/components/receipt/ReceiptUpload";

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
global.URL.createObjectURL = mockCreateObjectURL;

describe("ReceiptUpload", () => {
    const mockOnFileSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders upload buttons on mobile and drop zone on desktop", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
        expect(screen.getByText("Take Photo")).toBeInTheDocument();
        expect(screen.getByText("Upload File")).toBeInTheDocument();
        expect(screen.getByTestId("receipt-drop-zone")).toBeInTheDocument();
    });

    it("shows preview when previewUrl is provided", () => {
        render(
            <ReceiptUpload
                onFileSelect={mockOnFileSelect}
                previewUrl="blob:preview-url"
            />
        );
        expect(screen.getByTestId("receipt-preview-image")).toBeInTheDocument();
        expect(screen.getByText("Choose a different image")).toBeInTheDocument();
    });

    it("shows parsing indicator when isParsing is true", () => {
        render(
            <ReceiptUpload
                onFileSelect={mockOnFileSelect}
                isParsing={true}
            />
        );
        expect(screen.getByTestId("receipt-parsing-indicator")).toBeInTheDocument();
        expect(screen.getByText("Scanning receipt…")).toBeInTheDocument();
    });

    it("shows error message when error prop is provided", () => {
        render(
            <ReceiptUpload
                onFileSelect={mockOnFileSelect}
                error="Upload failed"
            />
        );
        expect(screen.getByTestId("receipt-upload-error")).toHaveTextContent("Upload failed");
    });

    it("validates file type and shows error for unsupported format", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);

        const input = screen.getByTestId("receipt-file-input");
        const file = new File(["content"], "test.pdf", { type: "application/pdf" });
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByTestId("receipt-upload-error")).toHaveTextContent(
            "Unsupported format"
        );
        expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it("validates file size and shows error for large files", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);

        const input = screen.getByTestId("receipt-file-input");
        // Create a file > 10MB
        const largeContent = new ArrayBuffer(11 * 1024 * 1024);
        const file = new File([largeContent], "big.jpg", { type: "image/jpeg" });
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByTestId("receipt-upload-error")).toHaveTextContent(
            "File too large"
        );
        expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it("calls onFileSelect with valid file", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);

        const input = screen.getByTestId("receipt-file-input");
        const file = new File(["image data"], "receipt.jpg", { type: "image/jpeg" });
        fireEvent.change(input, { target: { files: [file] } });

        expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
    });

    it("handles drag and drop", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);

        const dropZone = screen.getByTestId("receipt-drop-zone");
        const file = new File(["image data"], "receipt.png", { type: "image/png" });

        fireEvent.dragOver(dropZone, { preventDefault: vi.fn() });
        fireEvent.drop(dropZone, {
            preventDefault: vi.fn(),
            dataTransfer: { files: [file] },
        });

        expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
    });

    it("handles dragLeave event", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
        const dropZone = screen.getByTestId("receipt-drop-zone");

        fireEvent.dragOver(dropZone);
        fireEvent.dragLeave(dropZone);
        // No error, component still renders
        expect(dropZone).toBeInTheDocument();
    });

    it("handles camera input file change", () => {
        render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
        const input = screen.getByTestId("receipt-camera-input");
        const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
        fireEvent.change(input, { target: { files: [file] } });
        expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
    });

    it("handles file change in preview mode", () => {
        render(
            <ReceiptUpload
                onFileSelect={mockOnFileSelect}
                previewUrl="blob:preview-url"
            />
        );
        const input = screen.getByTestId("receipt-file-input");
        const file = new File(["new image"], "new.jpg", { type: "image/jpeg" });
        fireEvent.change(input, { target: { files: [file] } });
        expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
    });

    it("shows error in preview mode when error prop is set", () => {
        render(
            <ReceiptUpload
                onFileSelect={mockOnFileSelect}
                previewUrl="blob:preview-url"
                error="API error occurred"
            />
        );
        expect(screen.getByTestId("receipt-upload-error")).toHaveTextContent("API error occurred");
    });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock URL.createObjectURL & URL.revokeObjectURL ──
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: mockRevokeObjectURL,
  writable: true,
});

// ── Mock cn utility ──
vi.mock("@/lib/cn", () => ({
  cn: (...classes: (string | false | undefined | null)[]) =>
    classes.filter(Boolean).join(" "),
}));

// ── Import component after mocks ──
import ReceiptUpload from "@/components/receipt/ReceiptUpload";

describe("ReceiptUpload", () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue("blob:test-url");
  });

  // ── Initial render ──
  it("renders upload buttons in mobile view", () => {
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    expect(screen.getByText("Take Photo")).toBeInTheDocument();
    expect(screen.getByText("Upload File")).toBeInTheDocument();
  });

  it("renders drop zone in desktop view", () => {
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const dropZone = screen.getByTestId("receipt-drop-zone");
    expect(dropZone).toBeInTheDocument();
    expect(screen.getByText("Drag & drop or tap to choose a file")).toBeInTheDocument();
  });

  // ── File selection via file input ──
  it("calls onFileSelect with valid file", () => {
    const file = new File(["dummy content"], "receipt.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const fileInput = screen.getByTestId("receipt-file-input");

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
  });

  it("shows error for unsupported file type", () => {
    const file = new File(["dummy"], "receipt.gif", { type: "image/gif" });
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const fileInput = screen.getByTestId("receipt-file-input");

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByTestId("receipt-upload-error")).toHaveTextContent(
      "Unsupported format. Please upload a JPEG, PNG, or HEIC image."
    );
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it("shows error for oversized file", () => {
    const oversizedFile = new File(["x".repeat(11 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const fileInput = screen.getByTestId("receipt-file-input");

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByTestId("receipt-upload-error")).toHaveTextContent(
      "File too large"
    );
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  // ── Drag & drop ──
  it("handles drag over and drop", () => {
    const file = new File(["dummy"], "receipt.png", { type: "image/png" });
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const dropZone = screen.getByTestId("receipt-drop-zone");

    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass("border-accent"); // should have drag over class

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
  });

  // ── Preview mode ──
  it("renders preview image when previewUrl is provided", () => {
    render(
      <ReceiptUpload
        onFileSelect={mockOnFileSelect}
        previewUrl="https://example.com/receipt.jpg"
      />
    );
    const previewImg = screen.getByTestId("receipt-preview-image");
    expect(previewImg).toBeInTheDocument();
    expect(previewImg).toHaveAttribute("src", "https://example.com/receipt.jpg");
    expect(screen.getByText("Choose a different image")).toBeInTheDocument();
  });

  it("allows changing file in preview mode", () => {
    const file = new File(["new"], "new.jpg", { type: "image/jpeg" });
    render(
      <ReceiptUpload
        onFileSelect={mockOnFileSelect}
        previewUrl="https://example.com/old.jpg"
      />
    );
    const changeButton = screen.getByTestId("change-receipt-button");
    fireEvent.click(changeButton);
    const fileInput = screen.getByTestId("receipt-file-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file, "blob:test-url");
  });

  // ── Parsing state ──
  it("renders parsing indicator when isParsing is true", () => {
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} isParsing />);
    expect(screen.getByTestId("receipt-parsing-indicator")).toBeInTheDocument();
    expect(screen.getByText("Scanning receipt…")).toBeInTheDocument();
  });

  it("does not show preview when isParsing is true even with previewUrl", () => {
    render(
      <ReceiptUpload
        onFileSelect={mockOnFileSelect}
        previewUrl="https://example.com/receipt.jpg"
        isParsing
      />
    );
    expect(screen.queryByTestId("receipt-preview-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("receipt-parsing-indicator")).toBeInTheDocument();
  });

  // ── Error display ──
  it("shows error from props", () => {
    render(
      <ReceiptUpload
        onFileSelect={mockOnFileSelect}
        error="API error: Invalid image"
      />
    );
    const errorEl = screen.getByTestId("receipt-upload-error");
    expect(errorEl).toHaveTextContent("API error: Invalid image");
  });

  it("prefers validation error over prop error", () => {
    const file = new File(["dummy"], "receipt.gif", { type: "image/gif" });
    render(
      <ReceiptUpload
        onFileSelect={mockOnFileSelect}
        error="API error"
      />
    );
    const fileInput = screen.getByTestId("receipt-file-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    const errorEl = screen.getByTestId("receipt-upload-error");
    expect(errorEl).toHaveTextContent("Unsupported format");
    expect(errorEl).not.toHaveTextContent("API error");
  });

  // ── Camera input ──
  it("has camera input with capture attribute", () => {
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const cameraInput = screen.getByTestId("receipt-camera-input");
    expect(cameraInput).toHaveAttribute("capture", "environment");
  });

  it("clicking Take Photo triggers camera input", () => {
    render(<ReceiptUpload onFileSelect={mockOnFileSelect} />);
    const cameraInput = screen.getByTestId("receipt-camera-input");
    const takePhotoButton = screen.getByText("Take Photo");
    const clickSpy = vi.spyOn(cameraInput, "click");

    fireEvent.click(takePhotoButton);
    expect(clickSpy).toHaveBeenCalled();
  });
});

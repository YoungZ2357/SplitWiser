"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/cn";

// ═══════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (PRD §5.3)

// ═══════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════

export interface ReceiptUploadProps {
    /** Called when a valid file is selected. Parent receives the File for later upload. */
    onFileSelect: (file: File, previewUrl: string) => void;
    /** If a file was already selected, show its preview. */
    previewUrl?: string | null;
    /** Whether receipt is currently being parsed by the API. */
    isParsing?: boolean;
    /** Error message to display. */
    error?: string | null;
}

// ═══════════════════════════════════════════════════
//  Component
// ═══════════════════════════════════════════════════

export default function ReceiptUpload({
    onFileSelect,
    previewUrl,
    isParsing = false,
    error,
}: ReceiptUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const displayError = error || validationError;

    // ── Validate & process file ──
    const processFile = useCallback(
        (file: File) => {
            setValidationError(null);

            // Type check
            if (!ACCEPTED_TYPES.includes(file.type)) {
                setValidationError(
                    "Unsupported format. Please upload a JPEG, PNG, or HEIC image."
                );
                return;
            }

            // Size check
            if (file.size > MAX_FILE_SIZE) {
                setValidationError(
                    `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
                );
                return;
            }

            const url = URL.createObjectURL(file);
            onFileSelect(file, url);
        },
        [onFileSelect]
    );

    // ── Event handlers ──
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset input so re-selecting the same file still triggers onChange
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    // ── If we already have a preview, show it with "Change" option ──
    if (previewUrl && !isParsing) {
        return (
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-full max-w-[280px] rounded-xl overflow-hidden border border-border shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="w-full h-auto max-h-[360px] object-contain bg-surface-alt"
                        data-testid="receipt-preview-image"
                    />
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="font-sans text-[13px] text-accent bg-transparent border-none cursor-pointer underline"
                    data-testid="change-receipt-button"
                >
                    Choose a different image
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="receipt-file-input"
                />
            </div>
        );
    }

    // ── Parsing state ──
    if (isParsing) {
        return (
            <div className="flex flex-col items-center gap-3 py-8" data-testid="receipt-parsing-indicator">
                <div className="w-8 h-8 border-[2.5px] border-accent border-t-transparent rounded-full animate-spin" />
                <span className="font-sans text-sm text-text-muted">
                    Scanning receipt…
                </span>
            </div>
        );
    }

    // ── Drop zone (default state) ──
    return (
        <div className="flex flex-col gap-2.5">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="receipt-drop-zone"
                className={cn(
                    "flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-[2px] border-dashed cursor-pointer transition-all duration-200",
                    dragOver
                        ? "border-accent bg-accent-light"
                        : "border-border bg-surface hover:border-accent/40 hover:bg-accent-light/50"
                )}
            >
                {/* Camera icon */}
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-accent"
                >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                </svg>

                <span className="font-serif text-sm text-text">
                    Tap to take a photo or choose a file
                </span>
                <span className="font-sans text-[11px] text-text-muted">
                    JPEG, PNG, or HEIC · Max 10 MB
                </span>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                data-testid="receipt-file-input"
            />

            {/* Validation error */}
            {displayError && (
                <div
                    role="alert"
                    className="px-3 py-2 rounded-lg bg-red-light text-red font-sans text-xs"
                    data-testid="receipt-upload-error"
                >
                    {displayError}
                </div>
            )}
        </div>
    );
}
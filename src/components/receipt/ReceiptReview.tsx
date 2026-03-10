"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

// ═══════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════

export interface ParsedItem {
    name: string;
    price: number;
    confidence: "high" | "medium" | "low";
}

export interface ReceiptReviewProps {
    /** Local blob URL or Supabase Storage URL of the receipt image. */
    imageUrl: string;
    /** Items returned by POST /api/receipts/parse. */
    parsedItems: ParsedItem[];
    /** Called when user confirms the reviewed items → flows into BillForm step 1. */
    onConfirm: (items: ParsedItem[]) => void;
    /** Called when user wants to re-upload a different receipt. */
    onRetake: () => void;
    /** Whether the receipt items have been confirmed. */
    isConfirmed?: boolean;
    /** How many items were confirmed, to display in the collapsed state. */
    confirmedCount?: number;
}

// ═══════════════════════════════════════════════════
//  Component
// ═══════════════════════════════════════════════════

export default function ReceiptReview({
    imageUrl,
    parsedItems,
    onConfirm,
    onRetake,
    isConfirmed,
    confirmedCount = 0,
}: ReceiptReviewProps) {
    const [items, setItems] = useState<ParsedItem[]>(parsedItems);
    const [showImage, setShowImage] = useState(false); // mobile toggle

    // ── Item CRUD ──
    const updateItem = (index: number, field: "name" | "price", value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            { name: "", price: 0, confidence: "high" as const },
        ]);
    };

    const removeAllItems = () => {
        setItems([]);
    };

    const subtotal = items.reduce((s, i) => s + i.price, 0);

    const lowConfidenceCount = items.filter(
        (i) => i.confidence === "low" || i.confidence === "medium"
    ).length;

    if (isConfirmed) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-surface-alt border border-border mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Receipt" className="w-10 h-10 object-cover rounded bg-surface border border-border" />
                <span className="text-sm font-sans text-text-muted">
                    Receipt uploaded · {confirmedCount} item{confirmedCount !== 1 ? "s" : ""} parsed
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* ── Info banner ── */}
            {lowConfidenceCount > 0 && (
                <div
                    className="px-3 py-2 rounded-lg bg-amber-light font-sans text-xs text-[#92700C]"
                    data-testid="confidence-warning"
                >
                    {lowConfidenceCount} item{lowConfidenceCount > 1 ? "s" : ""} may
                    need review — flagged items are highlighted.
                </div>
            )}

            {/* ── Mobile: toggle receipt image ── */}
            <button
                onClick={() => setShowImage(!showImage)}
                className="flex items-center gap-1.5 font-sans text-[13px] text-accent bg-transparent border-none cursor-pointer p-0 md:hidden"
                data-testid="toggle-receipt-image"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
                {showImage ? "Hide receipt" : "View receipt"}
            </button>

            {/* ── Layout: side-by-side on desktop, stacked/toggled on mobile ── */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Receipt image — always visible on desktop, toggled on mobile */}
                <div
                    className={cn(
                        "md:w-[240px] md:shrink-0 md:block rounded-xl overflow-hidden border border-border",
                        showImage ? "block" : "hidden"
                    )}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt="Uploaded receipt"
                        className="w-full h-auto max-h-[400px] object-contain bg-surface-alt"
                        data-testid="receipt-review-image"
                    />
                </div>

                {/* Editable item list */}
                <div className="flex-1 flex flex-col gap-2">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-2.5 bg-surface rounded-[10px]",
                                "border border-border", // Base 1px border on all sides
                                item.confidence === "low" && "border-l-[3px] border-l-red bg-red-light",
                                item.confidence === "medium" && "border-l-[3px] border-l-amber bg-amber-light"
                            )}
                        >
                            <div className="flex-[2] flex items-center gap-2">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                        updateItem(i, "name", e.target.value)
                                    }
                                    placeholder="Item name"
                                    data-testid={`review-item-name-${i}`}
                                    className="border-none bg-transparent outline-none font-serif text-sm text-text w-full"
                                />
                                <ConfidenceBadge confidence={item.confidence} />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-sans text-sm text-text-muted">
                                    $
                                </span>
                                <input
                                    type="number"
                                    value={item.price || ""}
                                    onChange={(e) =>
                                        updateItem(
                                            i,
                                            "price",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    data-testid={`review-item-price-${i}`}
                                    className="border-none bg-transparent outline-none font-sans text-sm font-semibold text-text w-[60px] text-right"
                                />
                                <button
                                    onClick={() => removeItem(i)}
                                    aria-label={`Remove ${item.name || "item"}`}
                                    className="bg-transparent border-none cursor-pointer text-text-muted text-sm px-0.5"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add item */}
                    <button
                        onClick={addItem}
                        data-testid="review-add-item-button"
                        className="py-2.5 rounded-[10px] border-[1.5px] border-dashed border-border bg-transparent font-sans text-[13px] text-accent cursor-pointer"
                    >
                        + Add Item
                    </button>

                    {/* Subtotal */}
                    <div className="flex justify-between px-3.5 py-2 font-sans text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-text-muted">
                                {items.length} item{items.length !== 1 ? "s" : ""}
                            </span>
                            {items.length > 0 && (
                                <button
                                    onClick={removeAllItems}
                                    data-testid="review-clear-all-button"
                                    className="text-[11px] font-semibold tracking-wide text-red/80 hover:text-red transition-colors bg-transparent border-none cursor-pointer p-0"
                                >
                                    CLEAR ALL
                                </button>
                            )}
                        </div>
                        <span className="font-semibold text-text">
                            Subtotal: {formatCurrency(subtotal)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-2.5 mt-1">
                <button
                    onClick={onRetake}
                    data-testid="receipt-retake-button"
                    className="flex-1 py-3 rounded-[10px] border border-border bg-surface font-sans text-[13px] text-text-muted cursor-pointer"
                >
                    Re-upload
                </button>
                <button
                    onClick={() => onConfirm(items)}
                    data-testid="receipt-confirm-button"
                    disabled={items.length === 0}
                    className={cn(
                        "flex-[2] py-3 rounded-[10px] border-none font-sans text-[13px] font-semibold cursor-pointer transition-colors",
                        items.length === 0
                            ? "bg-surface-alt text-text-muted cursor-not-allowed"
                            : "bg-accent text-white"
                    )}
                >
                    Use {items.length} Item{items.length !== 1 ? "s" : ""}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
//  Micro components (local to this file)
// ═══════════════════════════════════════════════════

function ConfidenceBadge({ confidence }: { confidence: string }) {
    if (confidence === "high") return null;
    const isLow = confidence === "low";
    return (
        <span
            className={cn(
                "text-[10px] px-2 py-0.5 rounded-[10px] font-sans font-semibold tracking-wide shrink-0",
                isLow ? "bg-red-light text-red" : "bg-amber-light text-[#92700C]"
            )}
        >
            {isLow ? "LOW" : "MED"}
        </span>
    );
}
"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icons } from "@/lib/icons";
import { formatCurrency, formatDateShort } from "@/lib/format";

/** Matches the shape returned by GET /api/bills per PRD Section 5.2 */
export interface BillSummary {
    id: string;
    title: string;
    date: string;
    total: number;
    participant_count: number;
}

interface BillRowProps {
    bill: BillSummary;
    showBorder?: boolean;
    onClick?: () => void;
}

/**
 * BillRow — a single row in the bills table.
 */
export default function BillRow({ bill, showBorder = true, onClick }: BillRowProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            className={cn(
                "grid grid-cols-[1fr_120px_100px_100px] items-center px-6 py-3.5 cursor-pointer transition-[background] duration-[120ms]",
                showBorder && "border-b border-border",
                hovered ? "bg-surface-alt" : "bg-transparent"
            )}
        >
            {/* Title + Icon */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[9px] bg-accent-light flex items-center justify-center text-accent shrink-0">
                    {Icons.receipt}
                </div>
                <span className="font-sans text-sm font-semibold text-text truncate">
                    {bill.title}
                </span>
            </div>

            {/* Date */}
            <span className="font-sans text-[13px] text-text-muted flex items-center gap-[5px]">
                {Icons.calendar} {formatDateShort(bill.date)}
            </span>

            {/* Participants */}
            <span className="font-sans text-[13px] text-text-muted text-right flex items-center justify-end gap-[5px]">
                {Icons.users} {bill.participant_count}
            </span>

            {/* Total */}
            <span className="font-sans text-[14.5px] font-bold text-text text-right tracking-tight">
                {formatCurrency(bill.total)}
            </span>
        </div>
    );
}
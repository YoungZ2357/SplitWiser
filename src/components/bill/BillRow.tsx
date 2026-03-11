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
                "flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px_100px] gap-1 sm:gap-0 sm:items-center px-4 sm:px-6 py-3.5 min-h-[44px] cursor-pointer transition-[background] duration-[120ms]",
                showBorder && "border-b border-border",
                hovered ? "bg-surface-alt" : "bg-transparent"
            )}
        >
            {/* Title + Icon + Mobile Total */}
            <div className="flex items-start justify-between sm:items-center sm:justify-start w-full sm:w-auto">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[9px] bg-accent-light flex items-center justify-center text-accent shrink-0">
                        {Icons.receipt}
                    </div>
                    <span className="font-sans text-sm font-semibold text-text truncate pr-2 sm:pr-0">
                        {bill.title}
                    </span>
                </div>
                {/* Total shown on top right on mobile */}
                <span className="font-sans text-[14.5px] font-bold text-text sm:hidden shrink-0 mt-[8px]">
                    {formatCurrency(bill.total)}
                </span>
            </div>

            {/* Subtitle - Mobile Only */}
            <div className="flex items-center gap-1.5 ml-12 sm:hidden font-sans text-xs text-text-muted mt-0.5">
                <span>{formatDateShort(bill.date)}</span>
                <span>·</span>
                <span>{bill.participant_count} people</span>
            </div>

            {/* Date - Desktop */}
            <span className="font-sans text-[13px] text-text-muted items-center gap-[5px] hidden sm:flex">
                {Icons.calendar} {formatDateShort(bill.date)}
            </span>

            {/* Participants - Desktop */}
            <span className="font-sans text-[13px] text-text-muted text-right items-center justify-end gap-[5px] hidden sm:flex">
                {Icons.users} {bill.participant_count}
            </span>

            {/* Total - Desktop */}
            <span className="font-sans text-[14.5px] font-bold text-text text-right tracking-tight hidden sm:block">
                {formatCurrency(bill.total)}
            </span>
        </div>
    );
}
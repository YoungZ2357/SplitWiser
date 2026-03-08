"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
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
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 100px 100px",
                alignItems: "center",
                padding: "14px 24px",
                borderBottom: showBorder ? `1px solid ${COLORS.border}` : "none",
                background: hovered ? COLORS.surfaceAlt : "transparent",
                cursor: "pointer",
                transition: "background 0.12s ease",
            }}
        >
            {/* Title + Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: COLORS.accentLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: COLORS.accent, flexShrink: 0,
                }}>
                    {Icons.receipt}
                </div>
                <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}>
          {bill.title}
        </span>
            </div>

            {/* Date */}
            <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: COLORS.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 5,
            }}>
        {Icons.calendar} {formatDateShort(bill.date)}
      </span>

            {/* Participants */}
            <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: COLORS.textMuted,
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 5,
            }}>
        {Icons.users} {bill.participant_count}
      </span>

            {/* Total */}
            <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14.5,
                fontWeight: 700,
                color: COLORS.text,
                textAlign: "right",
                letterSpacing: "-0.01em",
            }}>
        {formatCurrency(bill.total)}
      </span>
        </div>
    );
}
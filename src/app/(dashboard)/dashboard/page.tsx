"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
import { Icons } from "@/lib/icons";
import BillRow from "@/components/bill/BillRow";
import type { BillSummary } from "@/components/bill/BillRow";
import EmptyState from "@/components/ui/EmptyState";
import PaginationBar from "@/components/ui/PaginationBar";
import DashboardShell from "@/components/layout/DashboardShell";
import { useRouter } from "next/navigation";

/* ── Mock data — shaped to match GET /api/bills response (PRD §5.2) ── */
const MOCK_BILLS: BillSummary[] = [
    { id: "1", title: "Costco Run", date: "2026-03-05", total: 87.43, participant_count: 3 },
    { id: "2", title: "Team Lunch — Shake Shack", date: "2026-03-03", total: 62.18, participant_count: 4 },
    { id: "3", title: "Grocery Split", date: "2026-02-28", total: 134.56, participant_count: 2 },
    { id: "4", title: "Dinner at Olive Garden", date: "2026-02-25", total: 98.70, participant_count: 5 },
    { id: "5", title: "Movie Night Snacks", date: "2026-02-22", total: 23.40, participant_count: 3 },
    { id: "6", title: "Weekend BBQ", date: "2026-02-18", total: 156.22, participant_count: 6 },
];

const SHOW_EMPTY_STATE = false; // toggle to preview empty state
const PER_PAGE = 20; // PRD: default 20

export default function DashboardPage() {
    const router = useRouter();
    const bills: BillSummary[] = SHOW_EMPTY_STATE ? [] : MOCK_BILLS;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(bills.length / PER_PAGE);
    const visibleBills = bills.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    return (
        <DashboardShell>
            {/* Page Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 24,
            }}>
                <div>
                    <h1 style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: 26,
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: "-0.02em",
                    }}>Your Bills</h1>
                    {bills.length > 0 && (
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13.5,
                            color: COLORS.textMuted,
                            margin: "4px 0 0",
                        }}>
                            {bills.length} bill{bills.length !== 1 ? "s" : ""} total
                        </p>
                    )}
                </div>
            </div>

            {/* Bill List or Empty State */}
            {bills.length === 0 ? (
                <EmptyState
                    icon={Icons.emptyReceipt}
                    title="No bills yet"
                    description="Create your first bill to start splitting expenses with friends."
                    actions={[
                        {
                            label: "Create a Bill",
                            icon: Icons.plus,
                            primary: true,
                            onClick: () => router.push("/bills/new"),
                        },
                        {
                            label: "Upload Receipt",
                            icon: Icons.camera,
                            primary: false,
                            onClick: () => router.push("/bills/new?mode=upload"),
                        },
                    ]}
                />
            ) : (
                <div style={{
                    background: COLORS.surface,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    overflow: "hidden",
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 120px 100px 100px",
                        padding: "12px 24px",
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: COLORS.surfaceAlt,
                    }}>
                        {["Bill", "Date", "People", "Total"].map((h, i) => (
                            <span key={h} style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: COLORS.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                textAlign: i >= 2 ? "right" : "left",
                            }}>{h}</span>
                        ))}
                    </div>

                    {/* Bill Rows */}
                    {visibleBills.map((bill, i) => (
                        <BillRow
                            key={bill.id}
                            bill={bill}
                            showBorder={i < visibleBills.length - 1}
                            onClick={() => router.push(`/bills/${bill.id}`)}
                        />
                    ))}

                    {/* Pagination */}
                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </DashboardShell>
    );
}
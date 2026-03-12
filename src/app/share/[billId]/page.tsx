"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate } from "@/lib/format";
import SplitSummary from "@/components/bill/SplitSummary";
import ItemList from "@/components/bill/ItemList";
import AssignmentGrid from "@/components/bill/AssignmentGrid";
import type { BillDetail } from "@/types";

type TabKey = "split" | "items" | "assignments";

export default function ShareBillPage() {
    const params = useParams<{ billId: string }>();
    const id = params.billId;

    const [data, setData] = useState<BillDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("split");

    /* ── Fetch bill detail ── */
    useEffect(() => {
        let cancelled = false;
        async function fetchBill() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/bills/${id}`);
                if (!cancelled) {
                    if (res.status === 404) {
                        setError("Bill not found.");
                    } else if (!res.ok) {
                        setError("Failed to load bill. Please try again.");
                    } else {
                        const json: BillDetail = await res.json();
                        setData(json);
                    }
                }
            } catch {
                if (!cancelled) setError("Network error. Please check your connection.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchBill();
        return () => { cancelled = true; };
    }, [id]);

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="px-4 py-[60px] text-center">
                <div role="status" className="font-sans text-[15px] text-text-muted">
                    Loading bill…
                </div>
            </div>
        );
    }

    /* ── Error state ── */
    if (error || !data) {
        return (
            <div className="px-4 py-[60px] text-center">
                <p role="alert" className="font-sans text-[15px] text-red mb-4">
                    {error ?? "Something went wrong."}
                </p>
            </div>
        );
    }

    const { bill, items, participants, assignments, split } = data;

    return (
        <div className="w-full max-w-[720px] mx-auto px-4 pt-6 pb-[100px]">
            {/* ── Header card ── */}
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-4">
                <div className="mb-4">
                    <div className="min-w-0 pr-2">
                        <h1 className="font-serif text-[26px] leading-tight tracking-tight text-text m-0 line-clamp-2">
                            {bill.title}
                        </h1>
                        <div className="text-[13px] text-text-muted mt-1">
                            {formatDate(bill.date)}
                        </div>
                    </div>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
                    {[
                        { label: "Subtotal", value: split.subtotal },
                        { label: "Tax", value: split.tax },
                        { label: "Tip", value: split.tip },
                        { label: "Total", value: split.total, accent: true },
                    ].map((cell) => (
                        <div key={cell.label} className="bg-surface px-4 py-3.5 text-center">
                            <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
                                {cell.label}
                            </div>
                            <div className={cn(
                                "text-lg font-semibold tabular-nums",
                                cell.accent ? "text-accent" : "text-text"
                            )}>
                                {formatCurrency(cell.value)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-border mb-4">
                {([
                    { key: "split" as TabKey, label: "Split Summary" },
                    { key: "items" as TabKey, label: `Items (${items.length})` },
                    { key: "assignments" as TabKey, label: "Assignments" },
                ]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "px-5 py-3 text-[13px] font-medium cursor-pointer font-inherit bg-transparent border-l-0 border-r-0 border-t-0 -mb-px transition-all duration-150 min-h-[44px]",
                            activeTab === tab.key
                                ? "text-accent border-b-2 border-accent"
                                : "text-text-muted border-b-2 border-transparent"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}
            {activeTab === "split" && (
                <SplitSummary
                    split={split}
                    items={items}
                    participants={participants}
                    assignments={assignments}
                />
            )}
            {activeTab === "items" && (
                <ItemList items={items} participants={participants} assignments={assignments} />
            )}
            {activeTab === "assignments" && (
                <AssignmentGrid items={items} participants={participants} assignments={assignments} />
            )}
        </div>
    );
}

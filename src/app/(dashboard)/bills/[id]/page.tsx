"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate } from "@/lib/format";
import Navbar from "@/components/layout/Navbar";
import SplitSummary from "@/components/bill/SplitSummary";
import ItemList from "@/components/bill/ItemList";
import AssignmentGrid from "@/components/bill/AssignmentGrid";
import type { BillDetail } from "@/types";

type TabKey = "split" | "items" | "assignments";

export default function BillDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [data, setData] = useState<BillDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("split");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
                    } else if (res.status === 403) {
                        setError("You do not have permission to view this bill.");
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

    /* ── Share handler ── */
    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/share/${id}`
        : "";

    const handleShare = useCallback(async () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: data?.bill.title ?? "SplitWiser Bill",
                    url: shareUrl,
                });
                return;
            } catch {
                // User cancelled native share — fall through to clipboard
            }
        }
        // Clipboard fallback
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            // Clipboard not available
        }
    }, [data, shareUrl]);

    /* ── Delete handler ── */
    const handleDelete = useCallback(async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
            if (res.ok || res.status === 204) {
                router.push("/dashboard");
            } else {
                setError("Failed to delete bill.");
                setShowDeleteDialog(false);
            }
        } catch {
            setError("Network error. Please try again.");
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
    }, [id, router]);

    const btnBaseCls = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium font-inherit cursor-pointer transition-all duration-150 border whitespace-nowrap";

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
                <button
                    onClick={() => router.push("/dashboard")}
                    className="font-sans text-[13px] font-medium text-accent bg-transparent border-none cursor-pointer underline"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { bill, items, participants, assignments, split } = data;

    return (
        <>
            <Navbar />
            <div className="w-full max-w-[720px] mx-auto px-4 pt-6 pb-[100px]">
                {/* Back link */}
                <a
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center gap-1.5 text-[13px] text-text-muted no-underline cursor-pointer mb-5"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Dashboard
                </a>

                {/* ── Header card ── */}
                <div className="bg-surface border border-border rounded-xl p-6 mb-4">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                            <h1 className="font-serif text-[26px] leading-tight tracking-tight text-text m-0">
                                {bill.title}
                            </h1>
                            <div className="text-[13px] text-text-muted mt-1">
                                {formatDate(bill.date)}
                            </div>
                        </div>
                        {/* Desktop actions */}
                        <div className="header-actions-desktop flex gap-2 shrink-0">
                            <button
                                onClick={handleShare}
                                className={cn(
                                    btnBaseCls,
                                    copiedLink
                                        ? "bg-green-light text-green border-green"
                                        : "bg-accent text-white border-accent"
                                )}
                            >
                                {copiedLink ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                        </svg>
                                        Share
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => router.push(`/bills/${id}/edit`)}
                                className={cn(btnBaseCls, "bg-transparent text-text border-border")}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className={cn(btnBaseCls, "bg-transparent text-red border-border")}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
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
                                "px-5 py-3 text-[13px] font-medium cursor-pointer font-inherit bg-transparent border-l-0 border-r-0 border-t-0 -mb-px transition-all duration-150",
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

            {/* ── Mobile bottom bar ── */}
            <div
                className="mobile-bottom-bar hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-2.5 z-[100]"
            >
                <div className="flex gap-2">
                    <button
                        onClick={handleShare}
                        className={cn(
                            btnBaseCls, "flex-1 justify-center",
                            copiedLink
                                ? "bg-green-light text-green border-green"
                                : "bg-accent text-white border-accent"
                        )}
                    >
                        {copiedLink ? "Copied!" : "Share"}
                    </button>
                    <button
                        onClick={() => router.push(`/bills/${id}/edit`)}
                        className={cn(btnBaseCls, "flex-1 justify-center bg-transparent text-text border-border")}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className={cn(btnBaseCls, "flex-1 justify-center bg-transparent text-red border-border")}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* ── Delete dialog ── */}
            {showDeleteDialog && (
                <div
                    onClick={() => setShowDeleteDialog(false)}
                    className="fixed inset-0 bg-[rgba(26,23,20,0.4)] flex items-center justify-center z-[200]"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="delete-dialog-title"
                        className="bg-surface rounded-xl p-7 max-w-[380px] w-[calc(100%-32px)] shadow-[0_20px_60px_rgba(26,23,20,0.2)]"
                    >
                        <div id="delete-dialog-title" className="font-serif text-xl mb-2">
                            Delete this bill?
                        </div>
                        <div className="text-sm text-text-muted leading-relaxed mb-5">
                            This will permanently delete &ldquo;{bill.title}&rdquo; and all associated items, participants, and assignments. This action cannot be undone.
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className={cn(btnBaseCls, "bg-transparent text-text border-border")}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className={cn(btnBaseCls, "bg-transparent text-red border-border")}
                            >
                                {deleting ? "Deleting…" : "Delete Bill"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Responsive CSS ── */}
            <style>{`
        @media (max-width: 640px) {
          .header-actions-desktop { display: none !important; }
          .mobile-bottom-bar { display: block !important; }
        }
      `}</style>
        </>
    );
}

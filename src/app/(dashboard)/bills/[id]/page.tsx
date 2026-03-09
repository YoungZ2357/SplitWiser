"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { COLORS } from "@/lib/colors";
import { formatCurrency, formatDate } from "@/lib/format";
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

    /* ── Loading state ── */
    if (loading) {
        return (
            <div style={{ padding: "60px 16px", textAlign: "center" }}>
                <div
                    role="status"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        color: COLORS.textMuted,
                    }}
                >
                    Loading bill…
                </div>
            </div>
        );
    }

    /* ── Error state ── */
    if (error || !data) {
        return (
            <div style={{ padding: "60px 16px", textAlign: "center" }}>
                <p
                    role="alert"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        color: COLORS.red,
                        marginBottom: 16,
                    }}
                >
                    {error ?? "Something went wrong."}
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        color: COLORS.accent,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { bill, items, participants, assignments, split } = data;

    /* ── Shared inline styles ── */
    const btnBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 0.15s",
        border: "1px solid transparent",
        whiteSpace: "nowrap",
    };

    return (
        <>
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 100px" }}>
                {/* Back link */}
                <a
                    onClick={() => router.push("/dashboard")}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: COLORS.textMuted,
                        textDecoration: "none",
                        cursor: "pointer",
                        marginBottom: 20,
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Dashboard
                </a>

                {/* ── Header card ── */}
                <div
                    style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 16,
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <h1
                                style={{
                                    fontFamily: "'DM Serif Display', serif",
                                    fontSize: 26,
                                    lineHeight: 1.2,
                                    letterSpacing: "-0.01em",
                                    color: COLORS.text,
                                    margin: 0,
                                }}
                            >
                                {bill.title}
                            </h1>
                            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
                                {formatDate(bill.date)}
                            </div>
                        </div>
                        {/* Desktop actions */}
                        <div
                            className="header-actions-desktop"
                            style={{ display: "flex", gap: 8, flexShrink: 0 }}
                        >
                            <button
                                onClick={handleShare}
                                style={{
                                    ...btnBase,
                                    ...(copiedLink
                                        ? { background: COLORS.greenLight, color: COLORS.green, borderColor: COLORS.green }
                                        : { background: COLORS.accent, color: "#fff", borderColor: COLORS.accent }),
                                }}
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
                                style={{ ...btnBase, background: "transparent", color: COLORS.text, borderColor: COLORS.border }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                style={{ ...btnBase, background: "transparent", color: COLORS.red, borderColor: COLORS.border }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Summary strip */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 1,
                            background: COLORS.border,
                            borderRadius: 8,
                            overflow: "hidden",
                        }}
                    >
                        {[
                            { label: "Subtotal", value: split.subtotal },
                            { label: "Tax", value: split.tax },
                            { label: "Tip", value: split.tip },
                            { label: "Total", value: split.total, accent: true },
                        ].map((cell) => (
                            <div key={cell.label} style={{ background: COLORS.surface, padding: "14px 16px", textAlign: "center" }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        color: COLORS.textMuted,
                                        marginBottom: 4,
                                    }}
                                >
                                    {cell.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 600,
                                        fontVariantNumeric: "tabular-nums",
                                        color: cell.accent ? COLORS.accent : COLORS.text,
                                    }}
                                >
                                    {formatCurrency(cell.value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div
                    style={{
                        display: "flex",
                        borderBottom: `1px solid ${COLORS.border}`,
                        marginBottom: 16,
                    }}
                >
                    {([
                        { key: "split" as TabKey, label: "Split Summary" },
                        { key: "items" as TabKey, label: `Items (${items.length})` },
                        { key: "assignments" as TabKey, label: "Assignments" },
                    ]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: "12px 20px",
                                fontSize: 13,
                                fontWeight: 500,
                                color: activeTab === tab.key ? COLORS.accent : COLORS.textMuted,
                                cursor: "pointer",
                                borderBottom: `2px solid ${activeTab === tab.key ? COLORS.accent : "transparent"}`,
                                marginBottom: -1,
                                fontFamily: "inherit",
                                background: "none",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                transition: "all 0.15s",
                            }}
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
                className="mobile-bottom-bar"
                style={{
                    display: "none",
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: COLORS.surface,
                    borderTop: `1px solid ${COLORS.border}`,
                    padding: "10px 16px",
                    zIndex: 100,
                }}
            >
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={handleShare}
                        style={{
                            ...btnBase,
                            flex: 1,
                            justifyContent: "center",
                            ...(copiedLink
                                ? { background: COLORS.greenLight, color: COLORS.green, borderColor: COLORS.green }
                                : { background: COLORS.accent, color: "#fff", borderColor: COLORS.accent }),
                        }}
                    >
                        {copiedLink ? "Copied!" : "Share"}
                    </button>
                    <button
                        onClick={() => router.push(`/bills/${id}/edit`)}
                        style={{ ...btnBase, flex: 1, justifyContent: "center", background: "transparent", color: COLORS.text, borderColor: COLORS.border }}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        style={{ ...btnBase, flex: 1, justifyContent: "center", background: "transparent", color: COLORS.red, borderColor: COLORS.border }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* ── Delete dialog ── */}
            {showDeleteDialog && (
                <div
                    onClick={() => setShowDeleteDialog(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(26,23,20,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 200,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="delete-dialog-title"
                        style={{
                            background: COLORS.surface,
                            borderRadius: 12,
                            padding: 28,
                            maxWidth: 380,
                            width: "calc(100% - 32px)",
                            boxShadow: "0 20px 60px rgba(26,23,20,0.2)",
                        }}
                    >
                        <div
                            id="delete-dialog-title"
                            style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: 20,
                                marginBottom: 8,
                            }}
                        >
                            Delete this bill?
                        </div>
                        <div style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.5, marginBottom: 20 }}>
                            This will permanently delete &ldquo;{bill.title}&rdquo; and all associated items, participants, and assignments. This action cannot be undone.
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                style={{ ...btnBase, background: "transparent", color: COLORS.text, borderColor: COLORS.border }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{ ...btnBase, background: "transparent", color: COLORS.red, borderColor: COLORS.border }}
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

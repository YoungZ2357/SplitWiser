"use client";

import { useState, useEffect, useCallback } from "react";
import { Icons } from "@/lib/icons";
import BillRow from "@/components/bill/BillRow";
import type { BillSummary } from "@/components/bill/BillRow";
import EmptyState from "@/components/ui/EmptyState";
import PaginationBar from "@/components/ui/PaginationBar";
import DashboardShell from "@/components/layout/DashboardShell";
import { useRouter } from "next/navigation";

const PER_PAGE = 20;

export default function DashboardPage() {
    const router = useRouter();
    const [bills, setBills] = useState<BillSummary[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBills = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/bills?page=${page}&limit=${PER_PAGE}`);
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login"); // Redirect to login if unauthorized
                    return;
                }
                throw new Error("Failed to load bills");
            }
            const data = await res.json();
            setBills(data.bills || []);
            setTotalCount(data.pagination?.total || 0);
            setTotalPages(Math.ceil((data.pagination?.total || 0) / PER_PAGE) || 1);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [router]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchBills(currentPage);
    }, [currentPage, fetchBills]);

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="font-serif text-[26px] font-bold tracking-tight m-0">
                        Your Bills
                    </h1>
                    {bills.length > 0 && !loading && (
                        <p className="font-sans text-[13.5px] text-text-muted mt-1 m-0">
                            {totalCount} bill{totalCount !== 1 ? "s" : ""} total
                        </p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-primary">
                    <div className="w-8 h-8 animate-spin flex items-center justify-center">
                        {Icons.spinner}
                    </div>
                </div>
            ) : error ? (
                <div className="text-destructive text-center py-10">
                    <p>{error}</p>
                    <button 
                        onClick={() => fetchBills(currentPage)} 
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-md font-medium"
                    >
                        Try Again
                    </button>
                </div>
            ) : bills.length === 0 ? (
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
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_120px_100px_100px] px-6 py-3 border-b border-border bg-surface-alt">
                        {["Bill", "Date", "People", "Total"].map((h, i) => (
                            <span
                                key={h}
                                className={`font-sans text-[11.5px] font-semibold text-text-muted uppercase tracking-wide ${i >= 2 ? "text-right" : "text-left"}`}
                            >{h}</span>
                        ))}
                    </div>

                    {/* Bill Rows */}
                    {bills.map((bill, i) => (
                        <BillRow
                            key={bill.id}
                            bill={bill}
                            showBorder={i < bills.length - 1}
                            onClick={() => router.push(`/bills/${bill.id}`)}
                        />
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <PaginationBar
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            )}
        </DashboardShell>
    );
}
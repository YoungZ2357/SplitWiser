"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BillForm, { mapBillDetailToFormState, type BillFormState } from "@/components/bill/BillForm";
import type { BillDetail } from "@/types";

export default function EditBillPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;

    const [formState, setFormState] = useState<BillFormState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                        setError("You do not have permission to edit this bill.");
                    } else if (!res.ok) {
                        setError("Failed to load bill. Please try again.");
                    } else {
                        const json: BillDetail = await res.json();
                        setFormState(mapBillDetailToFormState(json));
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

    if (loading) {
        return (
            <div className="px-4 py-[60px] text-center">
                <div role="status" className="font-sans text-[15px] text-text-muted">
                    Loading bill…
                </div>
            </div>
        );
    }

    if (error || !formState) {
        return (
            <div className="max-w-[720px] mx-auto px-4 py-[60px] text-center">
                <p role="alert" className="font-sans text-[15px] text-red mb-4">
                    {error ?? "Something went wrong."}
                </p>
                <button
                    onClick={() => router.push(`/bills/${id}`)}
                    className="font-sans text-[13px] font-medium text-accent bg-transparent border-none cursor-pointer underline"
                >
                    Back to detail
                </button>
            </div>
        );
    }

    return (
        <BillForm
            mode="edit"
            billId={id}
            initialData={formState}
            onSubmitSuccess={() => router.push(`/bills/${id}`)}
        />
    );
}

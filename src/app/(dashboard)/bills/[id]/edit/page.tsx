"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function EditBillPlaceholder() {
    const params = useParams<{ id: string }>();

    return (
        <>
            <Navbar />
            <div className="max-w-[720px] mx-auto px-4 py-[60px] text-center">
                <h1 className="font-serif text-2xl text-text mb-2">
                    Edit bill — Coming soon
                </h1>
                <p className="font-sans text-sm text-text-muted mb-6">
                    The edit functionality is not yet implemented.
                </p>
                <a
                    href={`/bills/${params.id}`}
                    className="font-sans text-[13px] font-medium text-accent underline"
                >
                    Back to bill detail
                </a>
            </div>
        </>
    );
}

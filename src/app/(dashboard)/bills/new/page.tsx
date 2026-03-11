"use client";

import BillForm from "@/components/bill/BillForm";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function NewBillPage() {
    const router = useRouter();
    return (
        <>
            <Navbar />
            <BillForm
                mode="create"
                onSubmitSuccess={(billId) => router.push(`/bills/${billId}`)}
            />
        </>
    );
}

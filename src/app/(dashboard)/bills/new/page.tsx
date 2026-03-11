"use client";

import BillForm from "@/components/bill/BillForm";
import { useRouter } from "next/navigation";

export default function NewBillPage() {
    const router = useRouter();
    return (
        <BillForm
            mode="create"
            onSubmitSuccess={(billId) => router.push(`/bills/${billId}`)}
        />
    );
}

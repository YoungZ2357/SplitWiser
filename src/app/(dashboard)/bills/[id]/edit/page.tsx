"use client";

import { useParams } from "next/navigation";
import { COLORS } from "@/lib/colors";

export default function EditBillPlaceholder() {
    const params = useParams<{ id: string }>();

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
            <h1
                style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 24,
                    color: COLORS.text,
                    marginBottom: 8,
                }}
            >
                Edit bill — Coming soon
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textMuted, marginBottom: 24 }}>
                The edit functionality is not yet implemented.
            </p>
            <a
                href={`/bills/${params.id}`}
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.accent,
                    textDecoration: "underline",
                }}
            >
                Back to bill detail
            </a>
        </div>
    );
}

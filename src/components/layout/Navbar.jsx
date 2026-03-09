"use client";

import { COLORS } from "@/lib/colors";
import { Icons } from "@/lib/icons";
// import { usePathname } from "next/navigation";
// import Link from "next/link";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Expenses", href: "/expenses" },
    { label: "History", href: "/history" },
];

export default function Navbar() {
    // TODO: replace with usePathname() when integrated into Next.js
    // const pathname = usePathname();
    const pathname = "/dashboard";

    return (
        <nav style={{
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "0 32px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 1px 3px rgba(26,23,20,0.04)",
        }}>
            {/* Left: Logo + Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                {/* TODO: wrap with <Link href="/dashboard"> */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    {Icons.logo}
                    <span style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 700,
                        fontSize: 19,
                        color: COLORS.text,
                        letterSpacing: "-0.02em",
                    }}>SplitWiser</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            // TODO: replace <button> with <Link href={item.href}>
                            <button
                                key={item.label}
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13.5,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? COLORS.accent : COLORS.textMuted,
                                    background: isActive ? COLORS.accentLight : "transparent",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "7px 14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Quick actions + Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* TODO: wrap with <Link href="/bills/new"> */}
                <button style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.surface,
                    background: COLORS.accent,
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 1px 3px rgba(192,86,33,0.25)",
                    transition: "all 0.15s ease",
                }}>
                    {Icons.plus}<span>New Bill</span>
                </button>

                {/* TODO: wrap with <Link href="/bills/new?mode=upload"> */}
                <button style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.accent,
                    background: COLORS.accentLight,
                    border: `1px solid rgba(192,86,33,0.15)`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                }}>
                    {Icons.camera}<span>Upload Receipt</span>
                </button>

                <div style={{ width: 1, height: 28, background: COLORS.border, margin: "0 6px" }} />

                {/* TODO: replace with UserMenu dropdown (logout, settings) */}
                <button style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: COLORS.textMuted,
                    padding: 4,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    {Icons.userCircle}
                </button>
            </div>
        </nav>
    );
}
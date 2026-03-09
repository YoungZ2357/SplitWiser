import type { ReactNode } from "react";
import { COLORS } from "@/lib/colors";

interface AuthLayoutProps {
    children: ReactNode;
}

/**
 * Auth layout — centered card on warm background, no Navbar.
 * Used by /login and /signup pages.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.bg,
            padding: 24,
        }}>
            <div style={{
                width: "100%",
                maxWidth: 420,
                background: COLORS.surface,
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                padding: "40px 32px",
            }}>
                {children}
            </div>
        </div>
    );
}

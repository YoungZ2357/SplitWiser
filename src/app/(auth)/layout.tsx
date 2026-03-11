import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
}

/**
 * Auth layout — centered card on warm background, no Navbar.
 * Used by /login and /signup pages.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4 sm:p-6">
            <div className="w-full max-w-[420px] bg-surface rounded-2xl border border-border px-6 py-8 sm:px-8 sm:py-10">
                {children}
            </div>
        </div>
    );
}

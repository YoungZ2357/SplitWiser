import type { ReactNode } from "react";

interface DashboardRouteLayoutProps {
    children: ReactNode;
}

/**
 * Route layout for the (dashboard) route group.
 *
 * Responsibilities (minimal):
 *   - Full-page background color + base font
 *   - Font loading (TODO: migrate to next/font in src/app/layout.tsx)
 *   - Global resets
 *
 * Does NOT include Navbar or content width constraints.
 * Each page decides whether to wrap its content in <DashboardShell>
 * or use a different shell (e.g. full-screen bill edit flow).
 */
export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
    return (
        <div className="min-h-screen bg-bg font-serif text-text">
            {/*
        TODO: move font loading to src/app/layout.tsx using next/font:
        import { Source_Serif_4, DM_Sans } from 'next/font/google';
      */}
            <link
                href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600;8..60,700&family=DM+Sans:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />

            {children}

            <style>{`
        ::selection { background: rgba(192,86,33,0.15); }
      `}</style>
        </div>
    );
}
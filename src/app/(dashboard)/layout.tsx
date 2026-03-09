import type { ReactNode } from "react";
import { COLORS } from "@/lib/colors";

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
        <div style={{
            minHeight: "100vh",
            background: COLORS.bg,
            fontFamily: "'Source Serif 4', 'Georgia', serif",
            color: COLORS.text,
        }}>
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:hover { opacity: 0.88; }
        button:active { transform: scale(0.98); }
        ::selection { background: rgba(192,86,33,0.15); }
      `}</style>
        </div>
    );
}
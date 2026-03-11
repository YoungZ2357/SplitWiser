import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import BottomTabBar from "@/components/layout/BottomTabBar";

interface DashboardShellProps {
    children: ReactNode;
    /** Override content max-width. Default 720px.
     *  e.g. receipt review side-by-side: maxWidth={1080} */
    maxWidth?: number;
}

/**
 * DashboardShell — opt-in visual container for dashboard-style pages.
 *
 * Provides:
 *   - Top Navbar
 *   - Centered content area with configurable maxWidth
 *   - Consistent padding
 *
 * Pages that need a different layout (e.g. full-screen bill edit)
 * simply don't use this component and render directly inside
 * the route layout.
 *
 * Future:
 *   - Add <BottomTabBar /> for mobile (Sprint 1 polish)
 *   - Accept `hideNav` prop for transitional flows
 */
export default function DashboardShell({ children, maxWidth = 720 }: DashboardShellProps) {
    return (
        <>
            <Navbar />

            <main className="w-full mx-auto pt-8 px-4 sm:px-6 pb-24 sm:pb-16" style={{ maxWidth }}>
                {children}
            </main>

            <BottomTabBar />
        </>
    );
}
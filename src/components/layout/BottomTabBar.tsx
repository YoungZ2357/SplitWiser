"use client";

import { Icons } from "@/lib/icons";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface TabItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const TABS: TabItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: Icons.receipt },
    { label: "New Bill", href: "/bills/new", icon: Icons.plus },
];

export default function BottomTabBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-surface flex sm:hidden justify-around items-center z-[100] pb-safe border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            {TABS.map((tab) => {
                const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/") && tab.href !== "/dashboard";
                
                return (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full h-full text-center transition-colors no-underline",
                            isActive ? "text-accent" : "text-text-muted hover:text-text"
                        )}
                        data-testid={`tab-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                        <div className={cn("p-1.5 rounded-full transition-colors", isActive && "bg-accent-light")}>
                            {tab.icon}
                        </div>
                        <span className="font-sans text-[10px] font-medium tracking-tight">
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

"use client";

import { cn } from "@/lib/cn";
import { Icons } from "@/lib/icons";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface NavItem {
    label: string;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <nav className="bg-surface border-b border-border px-8 h-[60px] flex items-center justify-between sticky top-0 z-[100] shadow-sm">
            {/* Left: Logo + Nav links */}
            <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer no-underline">
                    {Icons.logo}
                    <span className="font-serif font-bold text-[19px] text-text tracking-tight">
                        SplitWiser
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "font-sans text-[13.5px] border-none rounded-lg px-3.5 py-[7px] cursor-pointer transition-all duration-200 no-underline",
                                    isActive
                                        ? "font-semibold text-accent bg-accent-light"
                                        : "font-normal text-text-muted bg-transparent hover:bg-surface-hover"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Right: Quick actions + Profile */}
            <div className="flex items-center gap-2.5">
                <button
                    onClick={() => router.push("/bills/new")}
                    className="font-sans text-[13px] font-semibold text-surface bg-accent border-none rounded-lg px-4 py-2 cursor-pointer flex items-center gap-1.5 shadow-accent transition-all duration-150"
                >
                    {Icons.plus}<span>New Bill</span>
                </button>

                <button
                    onClick={() => router.push("/bills/new?mode=upload")}
                    className="font-sans text-[13px] font-medium text-accent bg-accent-light border border-accent/15 rounded-lg px-3.5 py-2 cursor-pointer flex items-center gap-1.5 transition-all duration-150"
                >
                    {Icons.camera}<span>Upload Receipt</span>
                </button>

                <div className="w-px h-7 bg-border mx-1.5" />

                {/* TODO: replace with UserMenu dropdown (logout, settings) */}
                <button className="bg-transparent border-none cursor-pointer text-text-muted p-1 rounded-full flex items-center justify-center">
                    {Icons.userCircle}
                </button>
            </div>
        </nav>
    );
}
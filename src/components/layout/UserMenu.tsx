"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/cn";

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    
    // Mock user data
    const mockEmail = "user@splitwiser.com";

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        // Simulate network delay for mock logout
        await new Promise((resolve) => setTimeout(resolve, 600));
        
        // In a real implementation: await supabase.auth.signOut();
        setIsLoggingOut(false);
        setIsOpen(false);
        // Redirect to homepage/login
        router.push("/");
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-transparent border-none cursor-pointer text-text-muted hover:text-text p-1 rounded-full flex flex-col items-center justify-center transition-colors focus:outline-none"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                {Icons.userCircle}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg shadow-black/5 z-[110] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-border/60">
                        <p className="text-[12px] font-medium text-text-muted mb-0.5">Logged in as</p>
                        <p className="text-[13.5px] font-semibold text-text truncate" title={mockEmail}>
                            {mockEmail}
                        </p>
                    </div>
                    
                    <div className="p-1.5">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 text-[13.5px] font-medium text-destructive bg-transparent border-none rounded-lg cursor-pointer transition-colors text-left",
                                isLoggingOut ? "opacity-60 cursor-not-allowed" : "hover:bg-destructive/10"
                            )}
                        >
                            {isLoggingOut ? (
                                <div className="w-[18px] h-[18px] border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                            ) : (
                                Icons.logOut
                            )}
                            {isLoggingOut ? "Logging out..." : "Log Out"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

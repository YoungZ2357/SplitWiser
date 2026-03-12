"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch user email on mount
    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserEmail(user?.email || null);
        }
        fetchUser();
    }, []);

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
        setIsOpen(false);
        
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error("Logout error:", error);
                // Even if there's an error, redirect to login page
                // The middleware will handle authentication state
            }
            
            // Redirect to login page after logout
            router.push("/login");
            // Force a page reload to clear any cached state
            router.refresh();
        } catch (err) {
            console.error("Unexpected logout error:", err);
            // Still redirect even on error
            router.push("/login");
            router.refresh();
        } finally {
            setIsLoggingOut(false);
        }
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
                        <p className="text-[13.5px] font-semibold text-text truncate" title={userEmail || "Loading..."}>
                            {userEmail || "Loading..."}
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

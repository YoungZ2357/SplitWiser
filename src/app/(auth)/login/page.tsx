"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

/** Simple email format check. */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // ── Client-side validation ──
        if (!email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (!isValidEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        // ── Supabase sign-in ──
        setLoading(true);
        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const labelCls = "block font-sans text-[13px] font-semibold text-text mb-1.5";
    const inputCls = "w-full px-3 py-2.5 font-sans text-sm rounded-lg border border-border outline-none bg-surface text-text box-border";

    return (
        <>
            {/* Brand */}
            <h1 className="font-serif text-[28px] font-bold text-accent tracking-tight text-center mb-1">
                SplitWiser
            </h1>
            <p className="font-sans text-sm text-text-muted text-center mb-8">
                Log in to your account
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-5">
                    <label htmlFor="login-email" className={labelCls}>Email</label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                    />
                </div>

                {/* Password */}
                <div className="mb-6">
                    <label htmlFor="login-password" className={labelCls}>Password</label>
                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                    />
                </div>

                {/* Error */}
                {error && (
                    <p role="alert" className="font-sans text-[13px] text-red mb-4">
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                        "w-full py-3 font-sans text-[15px] font-semibold text-white border-none rounded-[10px]",
                        loading
                            ? "bg-text-muted cursor-not-allowed"
                            : "bg-accent cursor-pointer"
                    )}
                >
                    {loading ? "Logging in…" : "Log In"}
                </button>
            </form>

            {/* Footer */}
            <p className="font-sans text-[13.5px] text-text-muted text-center mt-6">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="text-accent font-semibold no-underline">
                    Sign up
                </a>
            </p>
        </>
    );
}

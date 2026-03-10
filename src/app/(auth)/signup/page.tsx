"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

/** Simple email format check. */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
    // const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // ── Client-side validation ──
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (!isValidEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // ── Supabase sign-up ──
        setLoading(true);
        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            setSuccess(true);
            // Uncomment to redirect directly when email verification is disabled:
            // router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const labelCls = "block font-sans text-[13px] font-semibold text-text mb-1.5";
    const inputCls = "w-full px-3 py-2.5 font-sans text-sm rounded-lg border border-border outline-none bg-surface text-text box-border";

    // ── Success confirmation ──
    if (success) {
        return (
            <div className="text-center">
                <h1 className="font-serif text-[28px] font-bold text-accent tracking-tight mb-1">
                    SplitWiser
                </h1>
                <p className="font-sans text-[15px] text-green font-semibold mt-6 mb-2">
                    Account created!
                </p>
                <p className="font-sans text-sm text-text-muted m-0">
                    Please check your email to verify your account.
                </p>
                <p className="font-sans text-[13.5px] text-text-muted mt-6">
                    <a href="/login" className="text-accent font-semibold no-underline">
                        Go to Log In
                    </a>
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Brand */}
            <h1 className="font-serif text-[28px] font-bold text-accent tracking-tight text-center mb-1">
                SplitWiser
            </h1>
            <p className="font-sans text-sm text-text-muted text-center mb-8">
                Create your account
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-5">
                    <label htmlFor="signup-email" className={labelCls}>Email</label>
                    <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                    />
                </div>

                {/* Password */}
                <div className="mb-5">
                    <label htmlFor="signup-password" className={labelCls}>Password</label>
                    <input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                    />
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                    <label htmlFor="signup-confirm-password" className={labelCls}>Confirm Password</label>
                    <input
                        id="signup-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? "Creating account…" : "Sign Up"}
                </button>
            </form>

            {/* Footer */}
            <p className="font-sans text-[13.5px] text-text-muted text-center mt-6">
                Already have an account?{" "}
                <a href="/login" className="text-accent font-semibold no-underline">
                    Log in
                </a>
            </p>
        </>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/colors";
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

    return (
        <>
            {/* Brand */}
            <h1 style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.accent,
                letterSpacing: "-0.02em",
                margin: "0 0 4px",
                textAlign: "center",
            }}>
                SplitWiser
            </h1>
            <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: COLORS.textMuted,
                textAlign: "center",
                margin: "0 0 32px",
            }}>
                Log in to your account
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div style={{ marginBottom: 20 }}>
                    <label
                        htmlFor="login-email"
                        style={{
                            display: "block",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.text,
                            marginBottom: 6,
                        }}
                    >
                        Email
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 14,
                            borderRadius: 8,
                            border: `1px solid ${COLORS.border}`,
                            outline: "none",
                            background: COLORS.surface,
                            color: COLORS.text,
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 24 }}>
                    <label
                        htmlFor="login-password"
                        style={{
                            display: "block",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.text,
                            marginBottom: 6,
                        }}
                    >
                        Password
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 14,
                            borderRadius: 8,
                            border: `1px solid ${COLORS.border}`,
                            outline: "none",
                            background: COLORS.surface,
                            color: COLORS.text,
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {/* Error */}
                {error && (
                    <p
                        role="alert"
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            color: COLORS.red,
                            margin: "0 0 16px",
                        }}
                    >
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px 0",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        background: loading ? COLORS.textMuted : COLORS.accent,
                        border: "none",
                        borderRadius: 10,
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Logging in…" : "Log In"}
                </button>
            </form>

            {/* Footer */}
            <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5,
                color: COLORS.textMuted,
                textAlign: "center",
                marginTop: 24,
            }}>
                Don&apos;t have an account?{" "}
                <a
                    href="/signup"
                    style={{
                        color: COLORS.accent,
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    Sign up
                </a>
            </p>
        </>
    );
}

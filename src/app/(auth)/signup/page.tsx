"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/colors";
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

    // ── Success confirmation ──
    if (success) {
        return (
            <div style={{ textAlign: "center" }}>
                <h1 style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: COLORS.accent,
                    letterSpacing: "-0.02em",
                    margin: "0 0 4px",
                }}>
                    SplitWiser
                </h1>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    color: COLORS.green,
                    fontWeight: 600,
                    marginTop: 24,
                    marginBottom: 8,
                }}>
                    Account created!
                </p>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: COLORS.textMuted,
                    margin: 0,
                }}>
                    Please check your email to verify your account.
                </p>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13.5,
                    color: COLORS.textMuted,
                    marginTop: 24,
                }}>
                    <a
                        href="/login"
                        style={{
                            color: COLORS.accent,
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Go to Log In
                    </a>
                </p>
            </div>
        );
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
                Create your account
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div style={{ marginBottom: 20 }}>
                    <label
                        htmlFor="signup-email"
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
                        id="signup-email"
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
                <div style={{ marginBottom: 20 }}>
                    <label
                        htmlFor="signup-password"
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
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
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

                {/* Confirm Password */}
                <div style={{ marginBottom: 24 }}>
                    <label
                        htmlFor="signup-confirm-password"
                        style={{
                            display: "block",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.text,
                            marginBottom: 6,
                        }}
                    >
                        Confirm Password
                    </label>
                    <input
                        id="signup-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? "Creating account…" : "Sign Up"}
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
                Already have an account?{" "}
                <a
                    href="/login"
                    style={{
                        color: COLORS.accent,
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    Log in
                </a>
            </p>
        </>
    );
}

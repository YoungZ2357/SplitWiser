import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

/* ── Mock Supabase client ── */
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
        },
    }),
}));

import LoginPage from "@/app/(auth)/login/page";

describe("Login Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the login form with email and password inputs", () => {
        render(<LoginPage />);
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    });

    it("shows a link to the signup page", () => {
        render(<LoginPage />);
        const link = screen.getByText("Sign up");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "/signup");
    });

    it("shows error on empty submit", async () => {
        render(<LoginPage />);
        fireEvent.click(screen.getByRole("button", { name: "Log In" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Please fill in all fields."
        );
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("shows error on invalid email format", async () => {
        render(<LoginPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "abc" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log In" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Please enter a valid email address."
        );
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("shows error on failed login", async () => {
        mockSignInWithPassword.mockResolvedValueOnce({
            error: { message: "Invalid login credentials" },
        });

        render(<LoginPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "wrongpassword" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log In" }));

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(
                "Invalid login credentials"
            );
        });
    });

    it("redirects to dashboard on successful login", async () => {
        mockSignInWithPassword.mockResolvedValueOnce({ error: null });

        render(<LoginPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "correctpassword" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log In" }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });
});

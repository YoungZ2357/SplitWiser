import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock Supabase client ── */
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            signUp: mockSignUp,
        },
    }),
}));

import SignupPage from "@/app/(auth)/signup/page";

describe("Signup Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the signup form with email, password, and confirm password inputs", () => {
        render(<SignupPage />);
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    });

    it("shows a link to the login page", () => {
        render(<SignupPage />);
        const link = screen.getByText("Log in");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "/login");
    });

    it("shows error on empty submit", async () => {
        render(<SignupPage />);
        fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Please fill in all fields."
        );
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("shows error on invalid email format", async () => {
        render(<SignupPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "abc" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText("Confirm Password"), {
            target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Please enter a valid email address."
        );
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("shows error when passwords do not match", async () => {
        render(<SignupPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText("Confirm Password"), {
            target: { value: "differentpassword" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Passwords do not match."
        );
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("shows error on failed signup", async () => {
        mockSignUp.mockResolvedValueOnce({
            error: { message: "User already registered" },
        });

        render(<SignupPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText("Confirm Password"), {
            target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(
                "User already registered"
            );
        });
    });

    it("shows confirmation message on successful signup", async () => {
        mockSignUp.mockResolvedValueOnce({ error: null });

        render(<SignupPage />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "new@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText("Confirm Password"), {
            target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

        await waitFor(() => {
            expect(screen.getByText("Account created!")).toBeInTheDocument();
            expect(
                screen.getByText("Please check your email to verify your account.")
            ).toBeInTheDocument();
        });
    });
});

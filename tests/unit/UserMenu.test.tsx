import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

/* ── Mock Supabase client ── */
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: mockGetUser,
            signOut: mockSignOut,
        },
    }),
}));

/* ── Mock Icons ── */
vi.mock("@/lib/icons", () => ({
    Icons: {
        userCircle: <span data-testid="user-icon">UserIcon</span>,
        logOut: <span data-testid="logout-icon">LogOutIcon</span>,
    },
}));

import { UserMenu } from "@/components/layout/UserMenu";

describe("UserMenu", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetUser.mockResolvedValue({
            data: { user: { email: "test@example.com" } },
        });
        mockSignOut.mockResolvedValue({ error: null });
    });

    it("renders the user menu button", () => {
        render(<UserMenu />);
        expect(screen.getByLabelText("User menu")).toBeInTheDocument();
    });

    it("shows dropdown with email when clicked", async () => {
        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));

        await waitFor(() => {
            expect(screen.getByText("test@example.com")).toBeInTheDocument();
        });
        expect(screen.getByText("Logged in as")).toBeInTheDocument();
        expect(screen.getByText("Log Out")).toBeInTheDocument();
    });

    it("shows Loading... before email loads", () => {
        mockGetUser.mockReturnValue(new Promise(() => {})); // never resolves
        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("closes dropdown on outside click", async () => {
        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));

        await waitFor(() => {
            expect(screen.getByText("Log Out")).toBeInTheDocument();
        });

        // Click outside
        fireEvent.mouseDown(document.body);

        await waitFor(() => {
            expect(screen.queryByText("Log Out")).not.toBeInTheDocument();
        });
    });

    it("handles logout and redirects to login", async () => {
        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));

        await waitFor(() => {
            expect(screen.getByText("Log Out")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Log Out"));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith("/login");
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    it("redirects to login even on logout error", async () => {
        mockSignOut.mockResolvedValueOnce({ error: { message: "Sign out error" } });

        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));

        await waitFor(() => {
            expect(screen.getByText("Log Out")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Log Out"));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/login");
        });
    });

    it("redirects to login on unexpected logout error", async () => {
        mockSignOut.mockRejectedValueOnce(new Error("Network error"));

        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));

        await waitFor(() => {
            expect(screen.getByText("Log Out")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Log Out"));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/login");
        });
    });

    it("handles null user email gracefully", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
        });

        render(<UserMenu />);
        fireEvent.click(screen.getByLabelText("User menu"));

        await waitFor(() => {
            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });
    });
});

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock next/navigation ── */
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mockReplace }),
}));

/* ── Mock Supabase client ── */
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: mockGetUser,
        },
    }),
}));

import Home from "@/app/page";

describe("Home Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows spinner while checking auth", () => {
        mockGetUser.mockReturnValue(new Promise(() => {})); // never resolves
        render(<Home />);
        // The spinner div is rendered
        expect(document.querySelector('[style*="animation"]')).toBeInTheDocument();
    });

    it("redirects authenticated users to /dashboard", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: "user-1", email: "test@example.com" } },
        });

        render(<Home />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("redirects unauthenticated users to /login", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
        });

        render(<Home />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith("/login");
        });
    });
});

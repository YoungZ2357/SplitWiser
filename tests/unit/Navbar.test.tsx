import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

/* ── Mock next/navigation ── */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => "/dashboard",
}));

/* ── Mock next/link ── */
vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

/* ── Mock Icons ── */
vi.mock("@/lib/icons", () => ({
    Icons: {
        logo: <span data-testid="logo-icon">Logo</span>,
        plus: <span data-testid="plus-icon">+</span>,
        camera: <span data-testid="camera-icon">Cam</span>,
    },
}));

/* ── Mock UserMenu ── */
vi.mock("@/components/layout/UserMenu", () => ({
    UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

import Navbar from "@/components/layout/Navbar";

describe("Navbar", () => {
    it("renders logo and branding", () => {
        render(<Navbar />);
        expect(screen.getByText("SplitWiser")).toBeInTheDocument();
    });

    it("renders Dashboard nav link", () => {
        render(<Navbar />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders New Bill button that navigates to /bills/new", () => {
        render(<Navbar />);
        const newBillBtn = screen.getByText("New Bill");
        fireEvent.click(newBillBtn.closest("button")!);
        expect(mockPush).toHaveBeenCalledWith("/bills/new");
    });

    it("renders Upload Receipt button that navigates to /bills/new?mode=upload", () => {
        render(<Navbar />);
        const uploadBtn = screen.getByText("Upload Receipt");
        fireEvent.click(uploadBtn.closest("button")!);
        expect(mockPush).toHaveBeenCalledWith("/bills/new?mode=upload");
    });

    it("renders UserMenu component", () => {
        render(<Navbar />);
        expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });
});

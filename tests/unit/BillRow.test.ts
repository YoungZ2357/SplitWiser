import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/format";

describe("formatCurrency", () => {
    it("formats whole numbers with two decimal places", () => {
        expect(formatCurrency(10)).toBe("$10.00");
    });

    it("formats decimal numbers correctly", () => {
        expect(formatCurrency(87.43)).toBe("$87.43");
    });

    it("rounds to two decimal places", () => {
        expect(formatCurrency(12.999)).toBe("$13.00");
    });

    it("handles zero", () => {
        expect(formatCurrency(0)).toBe("$0.00");
    });
});

describe("formatDate", () => {
    it("formats ISO date string with year", () => {
        const result = formatDate("2026-03-05");
        expect(result).toBe("Mar 5, 2026");
    });
});

describe("formatDateShort", () => {
    it("formats ISO date string without year", () => {
        const result = formatDateShort("2026-03-05");
        expect(result).toBe("Mar 5");
    });

    it("handles single-digit day", () => {
        const result = formatDateShort("2026-01-03");
        expect(result).toBe("Jan 3");
    });
});
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import SplitSummary from "@/components/bill/SplitSummary";
import type { BillItem, Participant, ItemAssignment, SplitResult } from "@/types";

// Mock Avatar component
vi.mock("@/components/ui/Avatar", () => ({
    Avatar: ({ name, colorIndex, size }: { name: string; colorIndex: number; size?: number }) => (
        <div 
            data-testid={`avatar-${name}`}
            data-color-index={colorIndex}
            data-size={size}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    ),
}));

// Mock formatCurrency
vi.mock("@/lib/format", () => ({
    formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

// Mock cn utility
vi.mock("@/lib/cn", () => ({
    cn: (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" "),
}));

describe("SplitSummary", () => {
    const mockItems: BillItem[] = [
        { id: "item1", bill_id: "bill1", name: "Pizza", price: 24.00, is_ai_parsed: false, created_at: "2025-01-01" },
        { id: "item2", bill_id: "bill1", name: "Soda", price: 6.00, is_ai_parsed: false, created_at: "2025-01-01" },
        { id: "item3", bill_id: "bill1", name: "Salad", price: 12.00, is_ai_parsed: false, created_at: "2025-01-01" },
    ];

    const mockParticipants: Participant[] = [
        { id: "p1", bill_id: "bill1", name: "Alice", created_at: "2025-01-01" },
        { id: "p2", bill_id: "bill1", name: "Bob", created_at: "2025-01-01" },
        { id: "p3", bill_id: "bill1", name: "Charlie", created_at: "2025-01-01" },
    ];

    const mockAssignments: ItemAssignment[] = [
        // Pizza shared by Alice and Bob (24 / 2 = 12 each)
        { id: "a1", bill_item_id: "item1", participant_id: "p1" },
        { id: "a2", bill_item_id: "item1", participant_id: "p2" },
        // Soda assigned to Bob only (6 / 1 = 6)
        { id: "a3", bill_item_id: "item2", participant_id: "p2" },
        // Salad shared by all three (12 / 3 = 4 each)
        { id: "a4", bill_item_id: "item3", participant_id: "p1" },
        { id: "a5", bill_item_id: "item3", participant_id: "p2" },
        { id: "a6", bill_item_id: "item3", participant_id: "p3" },
    ];

    const mockSplit: SplitResult = {
        per_person: [
            {
                participant_id: "p1",
                participant_name: "Alice",
                items_subtotal: 16.00, // Pizza: 12 + Salad: 4
                tax_share: 1.60,
                tip_share: 2.40,
                total: 20.00,
            },
            {
                participant_id: "p2",
                participant_name: "Bob",
                items_subtotal: 22.00, // Pizza: 12 + Soda: 6 + Salad: 4
                tax_share: 2.20,
                tip_share: 3.30,
                total: 27.50,
            },
            {
                participant_id: "p3",
                participant_name: "Charlie",
                items_subtotal: 4.00, // Salad: 4
                tax_share: 0.40,
                tip_share: 0.60,
                total: 5.00,
            },
        ],
        subtotal: 42.00,
        tax: 4.20,
        tip: 6.30,
        total: 52.50,
    };

    it("renders each person with their total amount", () => {
        render(
            <SplitSummary 
                split={mockSplit}
                items={mockItems}
                participants={mockParticipants}
                assignments={mockAssignments}
            />
        );

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("$20.00")).toBeInTheDocument();
        
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("$27.50")).toBeInTheDocument();
        
        expect(screen.getByText("Charlie")).toBeInTheDocument();
        expect(screen.getByText("$5.00")).toBeInTheDocument();
    });

    it("renders avatar for each person", () => {
        render(
            <SplitSummary 
                split={mockSplit}
                items={mockItems}
                participants={mockParticipants}
                assignments={mockAssignments}
            />
        );

        expect(screen.getByTestId("avatar-Alice")).toBeInTheDocument();
        expect(screen.getByTestId("avatar-Bob")).toBeInTheDocument();
        expect(screen.getByTestId("avatar-Charlie")).toBeInTheDocument();
    });

    it("expands and collapses person details on click", async () => {
        const user = userEvent.setup();
        render(
            <SplitSummary 
                split={mockSplit}
                items={mockItems}
                participants={mockParticipants}
                assignments={mockAssignments}
            />
        );

        // Initially not expanded
        expect(screen.queryByTestId("person-detail-p1")).not.toBeInTheDocument();
        
        // Click Alice's header to expand
        const aliceHeader = screen.getByTestId("person-header-p1");
        await user.click(aliceHeader);
        
        // Should now see Alice's details
        expect(screen.getByTestId("person-detail-p1")).toBeInTheDocument();
        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("÷2")).toBeInTheDocument();
        expect(screen.getByText("$12.00")).toBeInTheDocument(); // 24 / 2
        
        // Click again to collapse
        await user.click(aliceHeader);
        expect(screen.queryByTestId("person-detail-p1")).not.toBeInTheDocument();
    });

    it("shows correct item details when expanded", async () => {
        const user = userEvent.setup();
        render(
            <SplitSummary 
                split={mockSplit}
                items={mockItems}
                participants={mockParticipants}
                assignments={mockAssignments}
            />
        );

        // Expand Bob's details
        const bobHeader = screen.getByTestId("person-header-p2");
        await user.click(bobHeader);

        // Bob should see:
        // - Pizza (shared with Alice) ÷2 = $12.00
        // - Soda (only Bob) no ÷ tag = $6.00
        // - Salad (shared with all) ÷3 = $4.00
        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("÷2")).toBeInTheDocument();
        expect(screen.getByText("$12.00")).toBeInTheDocument();
        
        expect(screen.getByText("Soda")).toBeInTheDocument();
        expect(screen.queryByText("÷1")).not.toBeInTheDocument(); // No ÷ tag for single person
        expect(screen.getByText("$6.00")).toBeInTheDocument();
        
        expect(screen.getByText("Salad")).toBeInTheDocument();
        expect(screen.getByText("÷3")).toBeInTheDocument();
        expect(screen.getByText("$4.00")).toBeInTheDocument();
    });

    it("shows breakdown of items subtotal, tax share, and tip share when expanded", async () => {
        const user = userEvent.setup();
        render(
            <SplitSummary 
                split={mockSplit}
                items={mockItems}
                participants={mockParticipants}
                assignments={mockAssignments}
            />
        );

        // Expand Alice's details
        const aliceHeader = screen.getByTestId("person-header-p1");
        await user.click(aliceHeader);

        // Check breakdown sections
        expect(screen.getByText("Items subtotal")).toBeInTheDocument();
        expect(screen.getByText("$16.00")).toBeInTheDocument();
        
        expect(screen.getByText("Tax share")).toBeInTheDocument();
        expect(screen.getByText("$1.60")).toBeInTheDocument();
        
        expect(screen.getByText("Tip share")).toBeInTheDocument();
        expect(screen.getByText("$2.40")).toBeInTheDocument();
    });

    it("only one person can be expanded at a time", async () => {
        const user = userEvent.setup();
        render(
            <SplitSummary 
                split={mockSplit}
                items={mockItems}
                participants={mockParticipants}
                assignments={mockAssignments}
            />
        );

        // Expand Alice
        await user.click(screen.getByTestId("person-header-p1"));
        expect(screen.getByTestId("person-detail-p1")).toBeInTheDocument();
        expect(screen.queryByTestId("person-detail-p2")).not.toBeInTheDocument();
        
        // Expand Bob - Alice should collapse
        await user.click(screen.getByTestId("person-header-p2"));
        expect(screen.queryByTestId("person-detail-p1")).not.toBeInTheDocument();
        expect(screen.getByTestId("person-detail-p2")).toBeInTheDocument();
        
        // Expand Charlie - Bob should collapse
        await user.click(screen.getByTestId("person-header-p3"));
        expect(screen.queryByTestId("person-detail-p2")).not.toBeInTheDocument();
        expect(screen.getByTestId("person-detail-p3")).toBeInTheDocument();
    });

    it("handles person with no assigned items", async () => {
        const splitWithEmpty: SplitResult = {
            per_person: [
                {
                    participant_id: "p1",
                    participant_name: "Alice",
                    items_subtotal: 0,
                    tax_share: 0,
                    tip_share: 0,
                    total: 0,
                },
            ],
            subtotal: 0,
            tax: 0,
            tip: 0,
            total: 0,
        };

        const assignmentsEmpty: ItemAssignment[] = [];

        render(
            <SplitSummary 
                split={splitWithEmpty}
                items={mockItems}
                participants={[mockParticipants[0]]}
                assignments={assignmentsEmpty}
            />
        );

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("$0.00")).toBeInTheDocument();
        
        // Expand - should show no items
        await userEvent.click(screen.getByTestId("person-header-p1"));
        expect(screen.getByTestId("person-detail-p1")).toBeInTheDocument();
        expect(screen.getByText("Items subtotal")).toBeInTheDocument();
        expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);
    });

    it("correctly calculates shared item price division", async () => {
        // Test specific case: item shared by 4 people
        const user = userEvent.setup();
        const singleItem: BillItem[] = [
            { id: "item1", bill_id: "bill1", name: "Cake", price: 40.00, is_ai_parsed: false, created_at: "2025-01-01" },
        ];
        
        const fourParticipants: Participant[] = [
            { id: "p1", bill_id: "bill1", name: "Alice", created_at: "2025-01-01" },
            { id: "p2", bill_id: "bill1", name: "Bob", created_at: "2025-01-01" },
            { id: "p3", bill_id: "bill1", name: "Charlie", created_at: "2025-01-01" },
            { id: "p4", bill_id: "bill1", name: "Diana", created_at: "2025-01-01" },
        ];
        
        const assignmentsAll: ItemAssignment[] = [
            { id: "a1", bill_item_id: "item1", participant_id: "p1" },
            { id: "a2", bill_item_id: "item1", participant_id: "p2" },
            { id: "a3", bill_item_id: "item1", participant_id: "p3" },
            { id: "a4", bill_item_id: "item1", participant_id: "p4" },
        ];
        
        const splitAll: SplitResult = {
            per_person: [
                {
                    participant_id: "p1",
                    participant_name: "Alice",
                    items_subtotal: 10.00, // 40 / 4
                    tax_share: 1.00,
                    tip_share: 1.50,
                    total: 12.50,
                },
                // ... other participants similar
            ],
            subtotal: 40.00,
            tax: 4.00,
            tip: 6.00,
            total: 50.00,
        };

        render(
            <SplitSummary 
                split={splitAll}
                items={singleItem}
                participants={fourParticipants}
                assignments={assignmentsAll}
            />
        );

        // Expand Alice
        await user.click(screen.getByTestId("person-header-p1"));
        
        // Should show Cake ÷4 = $10.00
        expect(screen.getByText("Cake")).toBeInTheDocument();
        expect(screen.getByText("÷4")).toBeInTheDocument();
        expect(screen.getAllByText("$10.00").length).toBeGreaterThan(0);
    });

    it("renders correctly with empty items array", () => {
        const emptySplit: SplitResult = {
            per_person: [],
            subtotal: 0,
            tax: 0,
            tip: 0,
            total: 0,
        };

        render(
            <SplitSummary 
                split={emptySplit}
                items={[]}
                participants={[]}
                assignments={[]}
            />
        );

        // Should render without errors, no person headers
        expect(screen.queryByTestId("person-header-p1")).not.toBeInTheDocument();
    });
});
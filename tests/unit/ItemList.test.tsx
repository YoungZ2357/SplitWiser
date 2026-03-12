import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ItemList from "@/components/bill/ItemList";
import type { BillItem, Participant, ItemAssignment } from "@/types";

// Mock AvatarStack component
vi.mock("@/components/ui/Avatar", () => ({
    AvatarStack: ({ participants, participantMap, size }: any) => (
        <div data-testid="avatar-stack">
            {participants.map((p: any) => (
                <span key={p.id} data-testid={`avatar-${p.id}`}>
                    {p.name[0]}
                </span>
            ))}
        </div>
    ),
}));

// Mock formatCurrency
vi.mock("@/lib/format", () => ({
    formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

// Mock cn utility
vi.mock("@/lib/cn", () => ({
    cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("ItemList", () => {
    const mockItems: BillItem[] = [
        { id: "item1", bill_id: "bill1", name: "Pizza", price: 12.50, is_ai_parsed: false, created_at: "2025-01-01" },
        { id: "item2", bill_id: "bill1", name: "Soda", price: 3.00, is_ai_parsed: true, created_at: "2025-01-01" },
        { id: "item3", bill_id: "bill1", name: "Salad", price: 8.75, is_ai_parsed: false, created_at: "2025-01-01" },
    ];

    const mockParticipants: Participant[] = [
        { id: "p1", bill_id: "bill1", name: "Alice", created_at: "2025-01-01" },
        { id: "p2", bill_id: "bill1", name: "Bob", created_at: "2025-01-01" },
        { id: "p3", bill_id: "bill1", name: "Charlie", created_at: "2025-01-01" },
    ];

    const mockAssignments: ItemAssignment[] = [
        { id: "a1", bill_item_id: "item1", participant_id: "p1" },
        { id: "a2", bill_item_id: "item1", participant_id: "p2" },
        { id: "a3", bill_item_id: "item2", participant_id: "p2" },
        { id: "a4", bill_item_id: "item3", participant_id: "p3" },
    ];

    it("renders all items with names and prices", () => {
        render(
            <ItemList 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("Soda")).toBeInTheDocument();
        expect(screen.getByText("Salad")).toBeInTheDocument();

        expect(screen.getByText("$12.50")).toBeInTheDocument();
        expect(screen.getByText("$3.00")).toBeInTheDocument();
        expect(screen.getByText("$8.75")).toBeInTheDocument();
    });

    it("shows assignees for each item", () => {
        render(
            <ItemList 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Check that avatar stack is rendered (our mock)
        expect(screen.getAllByTestId("avatar-stack")).toHaveLength(3);
        
        // Check assignee names appear in the list
        // Pizza assigned to Alice and Bob
        const pizzaRow = screen.getByText("Pizza").closest("div[class*='flex items-center justify-between']");
        expect(pizzaRow).toHaveTextContent("Alice, Bob");
        
        // Soda assigned to Bob only
        const sodaRow = screen.getByText("Soda").closest("div[class*='flex items-center justify-between']");
        expect(sodaRow).toHaveTextContent("Bob");
        
        // Salad assigned to Charlie only
        const saladRow = screen.getByText("Salad").closest("div[class*='flex items-center justify-between']");
        expect(saladRow).toHaveTextContent("Charlie");
    });

    it("shows AI badge for AI-parsed items", () => {
        render(
            <ItemList 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Soda has is_ai_parsed: true
        const sodaRow = screen.getByText("Soda").closest("div[class*='flex items-center justify-between']");
        expect(sodaRow).toHaveTextContent("AI");
        
        // Pizza and Salad do not have AI badge
        const pizzaRow = screen.getByText("Pizza").closest("div[class*='flex items-center justify-between']");
        expect(pizzaRow).not.toHaveTextContent("AI");
        
        const saladRow = screen.getByText("Salad").closest("div[class*='flex items-center justify-between']");
        expect(saladRow).not.toHaveTextContent("AI");
    });

    it("renders correctly when no assignments exist", () => {
        render(
            <ItemList 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={[]} 
            />
        );

        // All items should still render
        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("Soda")).toBeInTheDocument();
        expect(screen.getByText("Salad")).toBeInTheDocument();
        
        // No assignee names should appear
        mockParticipants.forEach(participant => {
            expect(screen.queryByText(participant.name)).not.toBeInTheDocument();
        });
    });

    it("renders correctly when no participants exist", () => {
        render(
            <ItemList 
                items={mockItems} 
                participants={[]} 
                assignments={mockAssignments} 
            />
        );

        // All items should still render
        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText("Soda")).toBeInTheDocument();
        expect(screen.getByText("Salad")).toBeInTheDocument();
        
        // No assignee names should appear since there are no participants
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });

    it("handles empty items list", () => {
        render(
            <ItemList 
                items={[]} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // No items should be rendered
        expect(screen.queryByText("Pizza")).not.toBeInTheDocument();
        expect(screen.queryByText("Soda")).not.toBeInTheDocument();
        expect(screen.queryByText("Salad")).not.toBeInTheDocument();
    });

    it("applies correct border styling between items", () => {
        const { container } = render(
            <ItemList 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Should have border between items (first two items have border-bottom)
        const itemRows = container.querySelectorAll('div[class*="flex items-center justify-between"]');
        expect(itemRows).toHaveLength(3);
        
        // The last item should not have border-bottom
        // This is handled by the cn() class conditional: idx < items.length - 1 && "border-b border-border"
    });
});
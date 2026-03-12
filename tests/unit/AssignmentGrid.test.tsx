import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AssignmentGrid from "@/components/bill/AssignmentGrid";
import type { BillItem, Participant, ItemAssignment } from "@/types";

// Mock Avatar component
vi.mock("@/components/ui/Avatar", () => ({
    Avatar: ({ name, colorIndex, size }: any) => (
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
    cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("AssignmentGrid", () => {
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
        // Pizza assigned to Alice and Bob
        { id: "a1", bill_item_id: "item1", participant_id: "p1" },
        { id: "a2", bill_item_id: "item1", participant_id: "p2" },
        // Soda assigned to Bob only
        { id: "a3", bill_item_id: "item2", participant_id: "p2" },
        // Salad assigned to no one (unassigned)
    ];

    it("renders desktop table with correct headers", () => {
        render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Desktop table should be rendered (hidden on mobile)
        const desktopTable = screen.getByRole("table");
        expect(desktopTable).toBeInTheDocument();
        // The table is wrapped in a div with class "hidden md:block overflow-x-auto"
        const tableWrapper = desktopTable.closest('div.hidden.md\\:block');
        expect(tableWrapper).toBeInTheDocument();

        // Check column headers within the table only
        const tableHeaders = within(desktopTable).getAllByRole("columnheader");
        expect(tableHeaders).toHaveLength(4); // Item + 3 participants
        
        // Item column
        expect(within(desktopTable).getByText("Item")).toBeInTheDocument();
        // Participant names appear in table header cells
        const participantNames = ["Alice", "Bob", "Charlie"];
        participantNames.forEach(name => {
            // Find the table header cell containing the name
            const headerCell = within(desktopTable).getByText((content, element) => {
                // Look for span elements that contain the participant name
                return element?.tagName === 'SPAN' && element.textContent === name;
            });
            expect(headerCell).toBeInTheDocument();
        });
    });

    it("renders mobile cards container", () => {
        const { container } = render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Mobile cards container should be rendered (hidden on desktop)
        const mobileCards = container.querySelector('div.flex.flex-col.gap-3.md\\:hidden');
        expect(mobileCards).toBeInTheDocument();
        expect(mobileCards).toHaveClass("flex", "flex-col", "gap-3", "md:hidden");
    });

    it("shows correct assignment indicators in desktop table", () => {
        render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        const table = screen.getByRole('table');
        
        // Check marks (✓) and dashes (–) for each cell
        // Pizza row: Alice ✓, Bob ✓, Charlie –
        const pizzaRow = within(table).getByText("Pizza").closest("tr");
        expect(pizzaRow).toHaveTextContent("✓");
        expect(pizzaRow).toHaveTextContent("✓");
        expect(pizzaRow).toHaveTextContent("–");
        
        // Soda row: Alice –, Bob ✓, Charlie –
        const sodaRow = within(table).getByText("Soda").closest("tr");
        expect(sodaRow).toHaveTextContent("–");
        expect(sodaRow).toHaveTextContent("✓");
        expect(sodaRow).toHaveTextContent("–");
        
        // Salad row: all –
        const saladRow = within(table).getByText("Salad").closest("tr");
        expect(saladRow).toHaveTextContent("–");
        expect(saladRow).toHaveTextContent("–");
        expect(saladRow).toHaveTextContent("–");
    });

    it("shows correct assignment checkboxes in mobile cards", () => {
        const { container } = render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );
        const mobileCardsContainer = container.querySelector('div.flex.flex-col.gap-3.md\\:hidden');
        expect(mobileCardsContainer).toBeInTheDocument();
        
        // Each item should have a card
        expect(within(mobileCardsContainer as HTMLElement).getByText("Pizza")).toBeInTheDocument();
        expect(within(mobileCardsContainer as HTMLElement).getByText("Soda")).toBeInTheDocument();
        expect(within(mobileCardsContainer as HTMLElement).getByText("Salad")).toBeInTheDocument();

        // Pizza card: Alice checked, Bob checked, Charlie unchecked
        const pizzaCard = within(mobileCardsContainer as HTMLElement).getByText("Pizza").closest('div[class*="bg-surface-alt"]');
        const pizzaCheckboxes = pizzaCard?.querySelectorAll('input[type="checkbox"]');
        expect(pizzaCheckboxes).toHaveLength(4); // Select All + 3 participants
        
        // Select All should be unchecked (not all participants assigned)
        expect(pizzaCheckboxes?.[0]).not.toBeChecked();
        
        // Alice checked
        expect(pizzaCheckboxes?.[1]).toBeChecked();
        // Bob checked
        expect(pizzaCheckboxes?.[2]).toBeChecked();
        // Charlie unchecked
        expect(pizzaCheckboxes?.[3]).not.toBeChecked();

        // Soda card: only Bob checked
        const sodaCard = within(mobileCardsContainer as HTMLElement).getByText("Soda").closest('div[class*="bg-surface-alt"]');
        const sodaCheckboxes = sodaCard?.querySelectorAll('input[type="checkbox"]');
        expect(sodaCheckboxes?.[0]).not.toBeChecked(); // Select All
        expect(sodaCheckboxes?.[1]).not.toBeChecked(); // Alice
        expect(sodaCheckboxes?.[2]).toBeChecked();     // Bob
        expect(sodaCheckboxes?.[3]).not.toBeChecked(); // Charlie
    });

    it("shows 'Select All' as checked when all participants assigned to an item", () => {
        const allAssignedAssignments: ItemAssignment[] = [
            { id: "a1", bill_item_id: "item1", participant_id: "p1" },
            { id: "a2", bill_item_id: "item1", participant_id: "p2" },
            { id: "a3", bill_item_id: "item1", participant_id: "p3" },
        ];

        const { container } = render(
            <AssignmentGrid 
                items={[mockItems[0]]} // Only Pizza
                participants={mockParticipants} 
                assignments={allAssignedAssignments} 
            />
        );

        // Find mobile cards container
        const mobileCardsContainer = container.querySelector('div.flex.flex-col.gap-3.md\\:hidden');
        expect(mobileCardsContainer).toBeInTheDocument();
        
        // Find pizza card within mobile container
        const pizzaCard = within(mobileCardsContainer as HTMLElement).getByText("Pizza").closest('div[class*="bg-surface-alt"]');
        expect(pizzaCard).toBeInTheDocument();
        
        // Get all checkboxes in the pizza card
        const allCheckboxes = pizzaCard?.querySelectorAll('input[type="checkbox"]');
        expect(allCheckboxes).toHaveLength(4); // Select All + 3 participants
        
        // Select All should be checked
        const selectAllCheckbox = allCheckboxes?.[0];
        expect(selectAllCheckbox).toBeChecked();
        
        // All participant checkboxes should also be checked
        const participantCheckboxes = Array.from(allCheckboxes || []).slice(1); // exclude first
        expect(participantCheckboxes).toHaveLength(3);
        participantCheckboxes.forEach(cb => {
            expect(cb).toBeChecked();
        });
    });

    it("renders avatar for each participant in desktop headers", () => {
        render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Avatar should be rendered for each participant in table headers
        // Desktop avatars have size 24 (mobile avatars have size 20)
        const desktopAvatars = screen.getAllByTestId("avatar-Alice").filter(avatar => 
            avatar.getAttribute("data-size") === "24"
        );
        expect(desktopAvatars).toHaveLength(1);
        expect(desktopAvatars[0]).toBeInTheDocument();
        
        const bobAvatars = screen.getAllByTestId("avatar-Bob").filter(avatar => 
            avatar.getAttribute("data-size") === "24"
        );
        expect(bobAvatars).toHaveLength(1);
        expect(bobAvatars[0]).toBeInTheDocument();
        
        const charlieAvatars = screen.getAllByTestId("avatar-Charlie").filter(avatar => 
            avatar.getAttribute("data-size") === "24"
        );
        expect(charlieAvatars).toHaveLength(1);
        expect(charlieAvatars[0]).toBeInTheDocument();
    });

    it("renders avatar for each participant in mobile cards", () => {
        render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Avatars should appear in mobile card labels (size 20)
        const aliceAvatars = screen.getAllByTestId("avatar-Alice").filter(avatar => 
            avatar.getAttribute("data-size") === "20"
        );
        expect(aliceAvatars.length).toBeGreaterThanOrEqual(1);
        const bobAvatars = screen.getAllByTestId("avatar-Bob").filter(avatar => 
            avatar.getAttribute("data-size") === "20"
        );
        expect(bobAvatars.length).toBeGreaterThanOrEqual(1);
        const charlieAvatars = screen.getAllByTestId("avatar-Charlie").filter(avatar => 
            avatar.getAttribute("data-size") === "20"
        );
        expect(charlieAvatars.length).toBeGreaterThanOrEqual(1);
    });

    it("handles empty items array", () => {
        const { container } = render(
            <AssignmentGrid 
                items={[]} 
                participants={mockParticipants} 
                assignments={[]} 
            />
        );

        // Desktop table should still render (empty)
        const desktopTable = screen.getByRole("table");
        expect(desktopTable).toBeInTheDocument();
        
        // Mobile cards container should render with no cards
        const mobileCardsContainer = container.querySelector('div.flex.flex-col.gap-3.md\\:hidden');
        expect(mobileCardsContainer).toBeInTheDocument();
        expect(mobileCardsContainer?.children).toHaveLength(0);
    });

    it("handles empty participants array", () => {
        const { container } = render(
            <AssignmentGrid 
                items={mockItems} 
                participants={[]} 
                assignments={[]} 
            />
        );

        // Desktop table should have only "Item" header column
        const desktopTable = screen.getByRole("table");
        expect(within(desktopTable).getByText("Item")).toBeInTheDocument();
        // No participant headers should be rendered
        expect(within(desktopTable).queryByText("Alice")).not.toBeInTheDocument();
        
        // Mobile cards container
        const mobileCardsContainer = container.querySelector('div.flex.flex-col.gap-3.md\\:hidden');
        expect(mobileCardsContainer).toBeInTheDocument();
        
        // Mobile cards should render items but no participant checkboxes
        expect(within(mobileCardsContainer as HTMLElement).getByText("Pizza")).toBeInTheDocument();
        expect(within(mobileCardsContainer as HTMLElement).getByText("Soda")).toBeInTheDocument();
        expect(within(mobileCardsContainer as HTMLElement).getByText("Salad")).toBeInTheDocument();
        
        // No participant checkboxes should exist (Select All checkboxes are still present but disabled)
        // Actually Select All checkboxes are still rendered but with muted text
        const checkboxes = within(mobileCardsContainer as HTMLElement).queryAllByRole("checkbox");
        // There should be 3 Select All checkboxes (one per item)
        expect(checkboxes).toHaveLength(3);
        // All checkboxes should be unchecked and read-only
        checkboxes.forEach(cb => {
            expect(cb).not.toBeChecked();
            expect(cb).toHaveAttribute("readonly");
        });
    });

    it("shows item prices in mobile cards", () => {
        render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // Each mobile card should show the item price
        expect(screen.getByText("$24.00")).toBeInTheDocument();
        expect(screen.getByText("$6.00")).toBeInTheDocument();
        expect(screen.getByText("$12.00")).toBeInTheDocument();
    });

    it("checkboxes are read-only in mobile cards", () => {
        render(
            <AssignmentGrid 
                items={mockItems} 
                participants={mockParticipants} 
                assignments={mockAssignments} 
            />
        );

        // All checkboxes should have readOnly attribute
        const checkboxes = screen.getAllByRole("checkbox");
        checkboxes.forEach(checkbox => {
            expect(checkbox).toHaveAttribute("readonly");
        });
        
        // Labels should have pointer-events-none class
        const labels = screen.getAllByText("Select All");
        labels.forEach(label => {
            expect(label.closest("label")).toHaveClass("pointer-events-none");
            expect(label.closest("label")).toHaveClass("cursor-default");
        });
    });
});
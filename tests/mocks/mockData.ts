// tests/mocks/mockData.ts

export const mockBillsList = [
    {
        id: "bill-1",
        title: "Dinner at John's",
        date: "2024-03-01",
        total: 120.50,
        participants: ["John", "Jane", "Doe"],
    },
    {
        id: "bill-2",
        title: "Groceries",
        date: "2024-03-05",
        total: 55.20,
        participants: ["Jane", "Doe"],
    },
];

export const mockBillDetails = new Map();
mockBillDetails.set("1", {
    bill: {
        id: "1",
        title: "Costco Run",
        date: "2024-03-10",
        tax: 8.50,
        tip: 0.00,
        receipt_image_url: null,
    },
    items: [
        { id: "i-1", name: "Milk", price: 4.99, is_ai_parsed: false },
        { id: "i-2", name: "Protein Bars", price: 12.99, is_ai_parsed: false },
        { id: "i-3", name: "Organic Granola", price: 8.49, is_ai_parsed: false },
    ],
    participants: [
        { id: "p-1", name: "Alice" },
        { id: "p-2", name: "Bob" },
        { id: "p-3", name: "Charlie" },
    ],
    assignments: [
        { bill_item_id: "i-1", participant_id: "p-1" },
        { bill_item_id: "i-2", participant_id: "p-2" },
        { bill_item_id: "i-3", participant_id: "p-3" },
    ],
    split: {
        subtotal: 26.47,
        tax: 8.50,
        tip: 0,
        total: 34.97,
        per_person: [
            {
                participant_id: "p-1",
                participant_name: "Alice",
                items_subtotal: 10,
                tax_share: 3,
                tip_share: 0,
                total: 13,
            },
            {
                participant_id: "p-2",
                participant_name: "Bob",
                items_subtotal: 10,
                tax_share: 3,
                tip_share: 0,
                total: 13,
            },
            {
                participant_id: "p-3",
                participant_name: "Charlie",
                items_subtotal: 6.47,
                tax_share: 2.50,
                tip_share: 0,
                total: 8.97,
            }
        ]
    },
});
mockBillDetails.set("test-bill-id", {
    bill: {
        id: "test-bill-id",
        title: "Costco Run",
        date: "2024-03-10",
        tax: 8.50,
        tip: 0.00,
        receipt_image_url: null,
    },
    items: [
        { id: "i-1", name: "Milk", price: 4.99, is_ai_parsed: false },
        { id: "i-2", name: "Protein Bars", price: 12.99, is_ai_parsed: false },
        { id: "i-3", name: "Organic Granola", price: 8.49, is_ai_parsed: false },
    ],
    participants: [
        { id: "p-1", name: "Alice" },
        { id: "p-2", name: "Bob" },
        { id: "p-3", name: "Charlie" },
    ],
    assignments: [
        { bill_item_id: "i-1", participant_id: "p-1" },
        { bill_item_id: "i-2", participant_id: "p-2" },
        { bill_item_id: "i-3", participant_id: "p-3" },
    ],
    split: {
        subtotal: 26.47,
        tax: 8.50,
        tip: 0,
        total: 34.97,
        per_person: []
    },
});

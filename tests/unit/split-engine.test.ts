import { describe, it, expect } from "vitest";
import { calculateSplit } from "../../src/lib/split-engine";
import { SplitInput } from "../../src/types";

describe("Split Calculation Engine", () => {
  it("handles Equal split (3 people, all items shared)", () => {
    const input: SplitInput = {
      items: [
        { id: "i1", name: "Dish 1", price: 30, assigned_to: [] },
        { id: "i2", name: "Dish 2", price: 60, assigned_to: [] },
      ],
      participants: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" },
      ],
      tax: 9,
      tip: 18,
    };

    // Subtotal: 90
    // Tax: 9
    // Tip: 18
    // Total: 117
    // Per person: 30 items + 3 tax + 6 tip = 39 total
    const result = calculateSplit(input);
    
    expect(result.subtotal).toBe(90);
    expect(result.tax).toBe(9);
    expect(result.tip).toBe(18);
    expect(result.total).toBe(117);

    expect(result.per_person).toHaveLength(3);
    result.per_person.forEach((p) => {
      expect(p.items_subtotal).toBe(30);
      expect(p.tax_share).toBe(3);
      expect(p.tip_share).toBe(6);
      expect(p.total).toBe(39);
    });
  });

  it("handles Mixed assignment (some personal, some shared)", () => {
    const input: SplitInput = {
      items: [
        { id: "i1", name: "Shared App", price: 15, assigned_to: [] },
        { id: "i2", name: "Alice Burger", price: 20, assigned_to: ["p1"] },
        { id: "i3", name: "Bob Salad", price: 10, assigned_to: ["p2"] },
      ],
      participants: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      tax: 4.5,
      tip: 9, // Total: 45 + 4.5 + 9 = 58.5
    };

    // Alice subtotal: 7.5 (half app) + 20 = 27.5
    // Bob subtotal: 7.5 + 10 = 17.5
    // Total items: 45
    // Alice ratio: 27.5 / 45 ≈ 0.6111
    // Bob ratio: 17.5 / 45 ≈ 0.3888

    // Tax Alice: 4.5 * 0.6111 = 2.75
    // Tax Bob: 4.5 * 0.3888 = 1.75
    
    // Tip Alice: 9 * 0.6111 = 5.50
    // Tip Bob: 9 * 0.3888 = 3.50

    // Alice Total = 27.5 + 2.75 + 5.5 = 35.75
    // Bob Total = 17.5 + 1.75 + 3.5 = 22.75
    // 35.75 + 22.75 = 58.5!

    const result = calculateSplit(input);
    expect(result.subtotal).toBe(45);
    expect(result.total).toBe(58.5);

    const alice = result.per_person.find(p => p.participant_name === "Alice")!;
    const bob = result.per_person.find(p => p.participant_name === "Bob")!;

    expect(alice.items_subtotal).toBe(27.5);
    expect(alice.tax_share).toBe(2.75);
    expect(alice.tip_share).toBe(5.5);
    expect(alice.total).toBe(35.75);

    expect(bob.items_subtotal).toBe(17.5);
    expect(bob.tax_share).toBe(1.75);
    expect(bob.tip_share).toBe(3.5);
    expect(bob.total).toBe(22.75);
  });

  it("handles Proportional tax and tip calculation", () => {
    // This was largely covered above, but let's test specific proportional cents rounding
    const input: SplitInput = {
      items: [
        { id: "i1", name: "A", price: 9.99, assigned_to: ["p1"] },
        { id: "i2", name: "B", price: 15.55, assigned_to: ["p2"] },
      ],
      participants: [
        { id: "p1", name: "P1" },
        { id: "p2", name: "P2" },
      ],
      tax: 2.12,
      tip: 4.50,
    };

    // Subtotal: 25.54
    // Ratios: P1: 9.99 / 25.54 ≈ 0.39115, P2: 15.55 / 25.54 ≈ 0.608849
    // Tax alloc: P1: 2.12 * 0.39115 = 0.829 (0.83), P2: 2.12 * 0.608849 = 1.2907 (1.29)
    // 0.83 + 1.29 = 2.12 (Exact!)
    // Tip alloc: P1: 4.50 * 0.39115 = 1.7601 (1.76), P2: 4.5 * 0.608849 = 2.7398 (2.74)
    // 1.76 + 2.74 = 4.50 (Exact!)

    const result = calculateSplit(input);

    const p1 = result.per_person.find(p => p.participant_id === "p1")!;
    const p2 = result.per_person.find(p => p.participant_id === "p2")!;

    expect(p1.tax_share).toBe(0.83);
    expect(p2.tax_share).toBe(1.29);

    expect(p1.tip_share).toBe(1.76);
    expect(p2.tip_share).toBe(2.74);
  });

  it("handles Rounding remainder allocation", () => {
    const input: SplitInput = {
      items: [
        { id: "i1", name: "A", price: 10, assigned_to: [] }, // shared among 3 = 3.33 each, remain 0.01
      ],
      participants: [
        { id: "p1", name: "Adam" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" },
      ],
      tax: 0,
      tip: 0,
    };
    // Item portion is 3.3333.
    // round2 gives 3.33. Sum is 9.99.
    // remainder is 0.01.
    // Largest subtotal is tie. Alphabetical: Adam is first, he gets 0.01 -> 3.34.

    const result = calculateSplit(input);
    const adam = result.per_person.find(p => p.participant_name === "Adam")!;
    const bob = result.per_person.find(p => p.participant_name === "Bob")!;
    const charlie = result.per_person.find(p => p.participant_name === "Charlie")!;

    expect(adam.items_subtotal).toBe(3.34);
    expect(bob.items_subtotal).toBe(3.33);
    expect(charlie.items_subtotal).toBe(3.33);
    expect(adam.total + bob.total + charlie.total).toBe(10);
  });

  it("handles Single participant", () => {
    const input: SplitInput = {
      items: [
        { id: "i1", name: "Solo meal", price: 25.50, assigned_to: [] },
      ],
      participants: [
        { id: "p1", name: "Alice" },
      ],
      tax: 2,
      tip: 4,
    };

    const result = calculateSplit(input);
    expect(result.per_person).toHaveLength(1);
    const alice = result.per_person[0];

    expect(alice.items_subtotal).toBe(25.5);
    expect(alice.tax_share).toBe(2);
    expect(alice.tip_share).toBe(4);
    expect(alice.total).toBe(31.5);
    expect(result.total).toBe(31.5);
  });

  it("handles Zero items", () => {
    const input: SplitInput = {
      items: [],
      participants: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      tax: 10,
      tip: 5,
    };

    const result = calculateSplit(input);
    expect(result.total).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.tip).toBe(0);
    
    expect(result.per_person[0].total).toBe(0);
    expect(result.per_person[1].total).toBe(0);
  });

  it("handles Zero tax/tip", () => {
    const input: SplitInput = {
      items: [
        { id: "i1", name: "A", price: 20, assigned_to: [] },
      ],
      participants: [
        { id: "p1", name: "A" },
        { id: "p2", name: "B" },
      ],
      tax: 0,
      tip: 0,
    };

    const result = calculateSplit(input);
    expect(result.tax).toBe(0);
    expect(result.tip).toBe(0);
    expect(result.total).toBe(20);
    expect(result.per_person[0].tax_share).toBe(0);
    expect(result.per_person[0].tip_share).toBe(0);
  });

  it("handles Large bill (50+ items, 10 participants)", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `i${i}`,
      name: `Item ${i}`,
      price: i + 1, // 1 to 50 = (50*51)/2 = 1275 sum
      assigned_to: i % 2 === 0 ? [] : [`p${i % 10}`], // Half shared, half assigned uniquely
    }));

    const participants = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      name: `Person ${i}`,
    }));

    const input: SplitInput = {
      items,
      participants,
      tax: 110.55,
      tip: 250.25,
    };

    const result = calculateSplit(input);

    expect(result.subtotal).toBe(1275);
    expect(result.tax).toBe(110.55);
    expect(result.tip).toBe(250.25);
    
    // Expect total sums to match precisely to prevent mathematically unsound sub-pennies
    const sumTotals = result.per_person.reduce((acc, p) => acc + p.total, 0);
    
    // Since numbers are floats we should round to 2 to compare
    expect(Math.round(sumTotals * 100) / 100).toBe(1275 + 110.55 + 250.25);
  });

  it("handles $0 price items properly", () => {
    const input: SplitInput = {
      items: [
        { id: "i1", name: "Water", price: 0, assigned_to: ["p1"] },
        { id: "i2", name: "Bread", price: 0, assigned_to: ["p2"] },
        { id: "i3", name: "Steak", price: 100, assigned_to: ["p1"] },
      ],
      participants: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
      tax: 10,
      tip: 20,
    };
    
    const result = calculateSplit(input);
    const alice = result.per_person.find(p => p.participant_name === "Alice")!;
    const bob = result.per_person.find(p => p.participant_name === "Bob")!;
    
    expect(alice.items_subtotal).toBe(100);
    expect(bob.items_subtotal).toBe(0);
    
    expect(alice.tax_share).toBe(10);
    expect(bob.tax_share).toBe(0);
  });
});

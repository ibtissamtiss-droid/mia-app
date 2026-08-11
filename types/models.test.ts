import { describe, it, expect } from "vitest";
import { documentTotals } from "./models";

describe("documentTotals", () => {
  it("computes subtotal, tax and total from line items", () => {
    const result = documentTotals({
      items: [
        { id: "1", description: "A", quantity: 2, unitPrice: 100, position: 0 },
        { id: "2", description: "B", quantity: 1, unitPrice: 50, position: 1 },
      ],
      taxRate: 20,
    });
    expect(result.subtotal).toBe(250);
    expect(result.tax).toBe(50);
    expect(result.total).toBe(300);
  });

  it("handles no items", () => {
    const result = documentTotals({ items: [], taxRate: 20 });
    expect(result).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it("handles a 0% tax rate", () => {
    const result = documentTotals({
      items: [{ id: "1", description: "A", quantity: 3, unitPrice: 10, position: 0 }],
      taxRate: 0,
    });
    expect(result).toEqual({ subtotal: 30, tax: 0, total: 30 });
  });
});

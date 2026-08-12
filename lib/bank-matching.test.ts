import { describe, it, expect } from "vitest";
import { findMatchingInvoice, type MatchableInvoice } from "./bank-matching";

const invoice = (id: string, total: number): MatchableInvoice => ({
  id,
  number: `FAC-${id}`,
  clientName: "Client Test",
  total,
});

describe("findMatchingInvoice", () => {
  it("finds an invoice whose total exactly matches the credit amount", () => {
    const invoices = [invoice("1", 500), invoice("2", 1200)];
    expect(findMatchingInvoice(1200, invoices)?.id).toBe("2");
  });

  it("returns null when no invoice matches", () => {
    const invoices = [invoice("1", 500)];
    expect(findMatchingInvoice(999, invoices)).toBeNull();
  });

  it("ignores non-positive amounts (debits, not credits)", () => {
    const invoices = [invoice("1", 500)];
    expect(findMatchingInvoice(-500, invoices)).toBeNull();
    expect(findMatchingInvoice(0, invoices)).toBeNull();
  });

  it("stays silent when multiple invoices share the same total (ambiguous)", () => {
    const invoices = [invoice("1", 500), invoice("2", 500)];
    expect(findMatchingInvoice(500, invoices)).toBeNull();
  });

  it("matches to the cent despite floating point noise", () => {
    const invoices = [invoice("1", 99.99)];
    expect(findMatchingInvoice(99.990000001, invoices)?.id).toBe("1");
    expect(findMatchingInvoice(100.0, invoices)).toBeNull();
  });
});

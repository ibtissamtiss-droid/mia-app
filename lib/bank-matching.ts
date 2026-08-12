export type MatchableInvoice = {
  id: string;
  number: string;
  clientName: string;
  total: number;
};

/**
 * Suggests a SENT invoice that a bank credit likely settles, by exact
 * amount (to the cent). Only a single, unambiguous candidate is returned —
 * if several unpaid invoices share the same total we'd rather stay silent
 * than confidently suggest the wrong one.
 */
export function findMatchingInvoice(amount: number, invoices: MatchableInvoice[]): MatchableInvoice | null {
  if (amount <= 0) return null;
  const cents = Math.round(amount * 100);
  const matches = invoices.filter((inv) => Math.round(inv.total * 100) === cents);
  return matches.length === 1 ? matches[0] : null;
}

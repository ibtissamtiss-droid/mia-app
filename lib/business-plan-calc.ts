import { effectiveCotisationRate } from "@/lib/forecast-calc";

export type LineItem = { amount: number };
export type ProductMargin = { unitPrice: number; unitCost: number; monthlyVolume: number };

export function sumAmounts(items: LineItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function computeFinancingGap(startupCosts: LineItem[], financingSources: LineItem[]) {
  return sumAmounts(startupCosts) - sumAmounts(financingSources);
}

export function computeMonthlyRevenue(productMargins: ProductMargin[]) {
  return productMargins.reduce((sum, p) => sum + p.unitPrice * p.monthlyVolume, 0);
}

export function computeMonthlyMargin(productMargins: ProductMargin[]) {
  return productMargins.reduce((sum, p) => sum + (p.unitPrice - p.unitCost) * p.monthlyVolume, 0);
}

export function computeMonthlyResult({
  productMargins,
  monthlyCharges,
  rate,
  acreEligible,
}: {
  productMargins: ProductMargin[];
  monthlyCharges: LineItem[];
  rate: number;
  acreEligible: boolean;
}) {
  const monthlyRevenue = computeMonthlyRevenue(productMargins);
  const monthlyMargin = computeMonthlyMargin(productMargins);
  const totalMonthlyCharges = sumAmounts(monthlyCharges);
  const effectiveRate = effectiveCotisationRate(rate, acreEligible);
  const monthlyCotisations = monthlyRevenue * (effectiveRate / 100);
  const monthlyResult = monthlyMargin - totalMonthlyCharges - monthlyCotisations;
  return { monthlyRevenue, monthlyMargin, totalMonthlyCharges, monthlyCotisations, monthlyResult };
}

export function computeBreakevenMonths(financingGap: number, monthlyResult: number) {
  return financingGap > 0 && monthlyResult > 0 ? Math.ceil(financingGap / monthlyResult) : null;
}

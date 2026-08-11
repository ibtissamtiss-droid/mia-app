import { describe, it, expect } from "vitest";
import {
  computeFinancingGap,
  computeMonthlyResult,
  computeBreakevenMonths,
} from "./business-plan-calc";

describe("computeFinancingGap", () => {
  it("returns the amount still needed when costs exceed financing", () => {
    const gap = computeFinancingGap([{ amount: 2000 }], [{ amount: 800 }]);
    expect(gap).toBe(1200);
  });

  it("returns a negative or zero value when financing covers the costs", () => {
    const gap = computeFinancingGap([{ amount: 1000 }], [{ amount: 1500 }]);
    expect(gap).toBe(-500);
  });

  it("returns 0 for empty lists", () => {
    expect(computeFinancingGap([], [])).toBe(0);
  });
});

describe("computeMonthlyResult", () => {
  const productMargins = [{ unitPrice: 300, unitCost: 50, monthlyVolume: 4 }];
  const monthlyCharges = [{ amount: 30 }];

  it("computes revenue, margin, charges and cotisations at the full rate", () => {
    const result = computeMonthlyResult({
      productMargins,
      monthlyCharges,
      rate: 21.1,
      acreEligible: false,
    });
    expect(result.monthlyRevenue).toBe(1200);
    expect(result.monthlyMargin).toBe(1000);
    expect(result.totalMonthlyCharges).toBe(30);
    expect(result.monthlyCotisations).toBeCloseTo(1200 * 0.211, 5);
    expect(result.monthlyResult).toBeCloseTo(1000 - 30 - 1200 * 0.211, 5);
  });

  it("halves the cotisation rate when ACRE-eligible", () => {
    const withAcre = computeMonthlyResult({
      productMargins,
      monthlyCharges,
      rate: 21.1,
      acreEligible: true,
    });
    const withoutAcre = computeMonthlyResult({
      productMargins,
      monthlyCharges,
      rate: 21.1,
      acreEligible: false,
    });
    expect(withAcre.monthlyCotisations).toBeCloseTo(withoutAcre.monthlyCotisations / 2, 5);
    expect(withAcre.monthlyResult).toBeGreaterThan(withoutAcre.monthlyResult);
  });

  it("can produce a negative result when charges and cotisations exceed margin", () => {
    const result = computeMonthlyResult({
      productMargins: [{ unitPrice: 10, unitCost: 8, monthlyVolume: 1 }],
      monthlyCharges: [{ amount: 500 }],
      rate: 21.1,
      acreEligible: false,
    });
    expect(result.monthlyResult).toBeLessThan(0);
  });
});

describe("computeBreakevenMonths", () => {
  it("returns the number of months needed to cover a positive financing gap", () => {
    expect(computeBreakevenMonths(1000, 250)).toBe(4);
    expect(computeBreakevenMonths(1001, 250)).toBe(5);
  });

  it("returns null when the financing gap is already covered", () => {
    expect(computeBreakevenMonths(0, 250)).toBeNull();
    expect(computeBreakevenMonths(-100, 250)).toBeNull();
  });

  it("returns null when the monthly result can't cover any gap", () => {
    expect(computeBreakevenMonths(1000, 0)).toBeNull();
    expect(computeBreakevenMonths(1000, -50)).toBeNull();
  });
});

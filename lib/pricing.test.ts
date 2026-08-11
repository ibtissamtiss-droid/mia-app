import { describe, it, expect } from "vitest";
import { computeRates, type PricingSettings } from "./pricing";

const base: PricingSettings = {
  targetNetIncome: 2500,
  workingDaysPerMonth: 18,
  hoursPerDay: 7,
  monthlyExpenses: 150,
};

describe("computeRates", () => {
  it("computes gross revenue, cotisations, daily and hourly rate", () => {
    const result = computeRates(base, 21.1);
    // (2500 + 150) / (1 - 0.211) = 3358.68...
    expect(result.grossRevenue).toBeCloseTo(3358.68, 2);
    expect(result.cotisations).toBeCloseTo(708.68, 2);
    expect(result.dailyRate).toBeCloseTo(186.59, 2);
    expect(result.hourlyRate).toBeCloseTo(26.66, 2);
  });

  it("ignores cotisations when rate is 0", () => {
    const result = computeRates(base, 0);
    expect(result.grossRevenue).toBeCloseTo(2650, 2);
    expect(result.cotisations).toBeCloseTo(0, 2);
  });

  it("returns 0 for daily/hourly rate when days or hours are 0", () => {
    expect(computeRates({ ...base, workingDaysPerMonth: 0 }, 21.1).dailyRate).toBe(0);
    expect(computeRates({ ...base, hoursPerDay: 0 }, 21.1).hourlyRate).toBe(0);
  });

  it("does not divide by zero or go negative when the rate is 100%", () => {
    const result = computeRates(base, 100);
    expect(result.grossRevenue).toBe(0);
    expect(Number.isFinite(result.dailyRate)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  monthKey,
  monthStart,
  nextMonths,
  monthLabel,
  computeForecastTotals,
} from "./forecast-calc";

describe("monthKey", () => {
  it("formats as YYYY-MM with zero-padded month", () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe("2026-01");
    expect(monthKey(new Date(2026, 10, 1))).toBe("2026-11");
  });
});

describe("monthStart", () => {
  it("returns the 1st of the month in UTC", () => {
    const d = monthStart(2026, 7);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7);
    expect(d.getUTCDate()).toBe(1);
  });

  it("rolls over into the next year when monthIndex >= 12", () => {
    const d = monthStart(2026, 12);
    expect(d.getUTCFullYear()).toBe(2027);
    expect(d.getUTCMonth()).toBe(0);
  });
});

describe("nextMonths", () => {
  it("returns the requested number of consecutive months starting this month", () => {
    const months = nextMonths(12);
    expect(months).toHaveLength(12);
    const now = new Date();
    expect(months[0].getUTCMonth()).toBe(now.getMonth());
    // consecutive months, no gaps or duplicates
    const keys = months.map(monthKey);
    expect(new Set(keys).size).toBe(12);
  });
});

describe("monthLabel", () => {
  it("capitalizes the French month name", () => {
    expect(monthLabel("2026-01")).toBe("Janvier 2026");
    expect(monthLabel("2026-12")).toBe("Décembre 2026");
  });
});

describe("computeForecastTotals", () => {
  it("sums revenue/expenses and applies the cotisation rate to the total", () => {
    const months = [
      { month: "2026-01", revenue: 1000, expenses: 100 },
      { month: "2026-02", revenue: 2000, expenses: 200 },
    ];
    const result = computeForecastTotals(months, 21.1);
    expect(result.revenue).toBe(3000);
    expect(result.expenses).toBe(300);
    expect(result.cotisations).toBeCloseTo(633, 2);
    expect(result.net).toBeCloseTo(3000 - 300 - 633, 2);
  });

  it("returns zeros for an empty month list", () => {
    const result = computeForecastTotals([], 21.1);
    expect(result).toEqual({ revenue: 0, expenses: 0, cotisations: 0, net: 0 });
  });
});

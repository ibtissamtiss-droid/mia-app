import { describe, it, expect } from "vitest";
import { startOfMonth, startOfQuarter, startOfYear } from "./dates";

describe("startOfMonth", () => {
  it("returns the 1st of the given month", () => {
    expect(startOfMonth(new Date(2026, 7, 15))).toEqual(new Date(2026, 7, 1));
  });
});

describe("startOfQuarter", () => {
  it.each([
    [0, 0], // Jan -> Q1 starts Jan
    [1, 0],
    [2, 0],
    [3, 3], // Apr -> Q2 starts Apr
    [5, 3],
    [6, 6], // Jul -> Q3 starts Jul
    [9, 9], // Oct -> Q4 starts Oct
    [11, 9],
  ])("month index %i maps to quarter start month %i", (monthIndex, expectedMonth) => {
    const result = startOfQuarter(new Date(2026, monthIndex, 20));
    expect(result.getMonth()).toBe(expectedMonth);
    expect(result.getDate()).toBe(1);
    expect(result.getFullYear()).toBe(2026);
  });
});

describe("startOfYear", () => {
  it("returns January 1st of the given year", () => {
    expect(startOfYear(new Date(2026, 10, 25))).toEqual(new Date(2026, 0, 1));
  });
});

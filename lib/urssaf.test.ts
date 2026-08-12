import { describe, it, expect } from "vitest";
import { declarationPeriodRange, periodLabel, nextDeclarationDeadline } from "./urssaf";

describe("declarationPeriodRange", () => {
  it("returns the previous calendar month for MONTHLY", () => {
    const { start, end } = declarationPeriodRange("MONTHLY", new Date(2026, 7, 12)); // 12 Aug 2026
    expect(start).toEqual(new Date(2026, 6, 1));
    expect(end).toEqual(new Date(2026, 7, 1));
  });

  it("rolls over into the previous year in January", () => {
    const { start, end } = declarationPeriodRange("MONTHLY", new Date(2026, 0, 5));
    expect(start).toEqual(new Date(2025, 11, 1));
    expect(end).toEqual(new Date(2026, 0, 1));
  });

  it("returns the previous calendar quarter for QUARTERLY", () => {
    const { start, end } = declarationPeriodRange("QUARTERLY", new Date(2026, 7, 12)); // Q3 -> previous is Q2
    expect(start).toEqual(new Date(2026, 3, 1));
    expect(end).toEqual(new Date(2026, 6, 1));
  });

  it("rolls the quarter over into the previous year in Q1", () => {
    const { start, end } = declarationPeriodRange("QUARTERLY", new Date(2026, 1, 15)); // Q1 -> previous is Q4 2025
    expect(start).toEqual(new Date(2025, 9, 1));
    expect(end).toEqual(new Date(2026, 0, 1));
  });
});

describe("periodLabel", () => {
  it("formats a month label", () => {
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) };
    expect(periodLabel("MONTHLY", range)).toBe("Juillet 2026");
  });

  it("formats a quarter label", () => {
    const range = { start: new Date(2026, 3, 1), end: new Date(2026, 6, 1) };
    expect(periodLabel("QUARTERLY", range)).toBe("T2 2026");
  });
});

describe("nextDeclarationDeadline", () => {
  it("returns this month when the day hasn't passed yet", () => {
    const deadline = nextDeclarationDeadline(20, new Date(2026, 7, 12));
    expect(deadline).toEqual(new Date(2026, 7, 20));
  });

  it("treats today as still upcoming", () => {
    const deadline = nextDeclarationDeadline(12, new Date(2026, 7, 12, 18, 30));
    expect(deadline).toEqual(new Date(2026, 7, 12));
  });

  it("rolls over to next month when the day has passed", () => {
    const deadline = nextDeclarationDeadline(5, new Date(2026, 7, 12));
    expect(deadline).toEqual(new Date(2026, 8, 5));
  });

  it("clamps out-of-range days into 1-28", () => {
    expect(nextDeclarationDeadline(31, new Date(2026, 7, 1))).toEqual(new Date(2026, 7, 28));
    expect(nextDeclarationDeadline(0, new Date(2026, 7, 1))).toEqual(new Date(2026, 7, 1));
  });
});

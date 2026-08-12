export type UrssafPeriod = "MONTHLY" | "QUARTERLY";

/**
 * The period an auto-entrepreneur declares to URSSAF is always the one that
 * just ended (you declare July's revenue during August, Q1's revenue during Q2...).
 */
export function declarationPeriodRange(period: UrssafPeriod, now: Date) {
  if (period === "QUARTERLY") {
    const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const end = new Date(now.getFullYear(), currentQuarterMonth, 1);
    const start = new Date(end.getFullYear(), end.getMonth() - 3, 1);
    return { start, end };
  }
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  return { start, end };
}

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function periodLabel(period: UrssafPeriod, range: { start: Date; end: Date }) {
  if (period === "QUARTERLY") {
    const quarter = Math.floor(range.start.getMonth() / 3) + 1;
    return `T${quarter} ${range.start.getFullYear()}`;
  }
  return `${MONTH_NAMES[range.start.getMonth()]} ${range.start.getFullYear()}`;
}

/**
 * Next occurrence of the user's own declaration day (as told to us; we never
 * guess or invent an official URSSAF calendar date).
 */
export function nextDeclarationDeadline(declarationDay: number, now: Date) {
  const day = Math.min(Math.max(Math.round(declarationDay), 1), 28);
  if (day >= now.getDate()) {
    return new Date(now.getFullYear(), now.getMonth(), day);
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, day);
}

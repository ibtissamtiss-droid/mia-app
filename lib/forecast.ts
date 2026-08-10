import { prisma } from "@/lib/db";

const MONTHS_AHEAD = 12;

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthStart(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1));
}

export function nextMonths(count: number) {
  const now = new Date();
  const months: Date[] = [];
  for (let i = 0; i < count; i++) {
    months.push(monthStart(now.getFullYear(), now.getMonth() + i));
  }
  return months;
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export async function getForecastSummary(userId: string) {
  const [user, entries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { cotisationRate: true } }),
    prisma.forecastEntry.findMany({ where: { userId } }),
  ]);

  const entriesByKey = new Map(entries.map((e) => [monthKey(e.month), e]));
  const rate = user?.cotisationRate ?? 0;

  const months = nextMonths(MONTHS_AHEAD).map((month) => {
    const key = monthKey(month);
    const entry = entriesByKey.get(key);
    return {
      month: key,
      revenue: entry?.revenue ?? 0,
      expenses: entry?.expenses ?? 0,
    };
  });

  const totals = months.reduce(
    (acc, m) => ({ revenue: acc.revenue + m.revenue, expenses: acc.expenses + m.expenses }),
    { revenue: 0, expenses: 0 }
  );
  const cotisations = totals.revenue * (rate / 100);
  const net = totals.revenue - totals.expenses - cotisations;

  return { rate, months, totals: { ...totals, cotisations, net } };
}

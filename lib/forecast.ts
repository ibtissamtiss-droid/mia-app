import { prisma } from "@/lib/db";
import { monthKey, nextMonths, computeForecastTotals, type ForecastMonth } from "@/lib/forecast-calc";

export * from "@/lib/forecast-calc";

const MONTHS_AHEAD = 12;

export async function getForecastSummary(userId: string) {
  const [user, entries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { cotisationRate: true } }),
    prisma.forecastEntry.findMany({ where: { userId } }),
  ]);

  const entriesByKey = new Map(entries.map((e) => [monthKey(e.month), e]));
  const rate = user?.cotisationRate ?? 0;

  const months: ForecastMonth[] = nextMonths(MONTHS_AHEAD).map((month) => {
    const key = monthKey(month);
    const entry = entriesByKey.get(key);
    return {
      month: key,
      revenue: entry?.revenue ?? 0,
      expenses: entry?.expenses ?? 0,
    };
  });

  const totals = computeForecastTotals(months, rate);

  return { rate, months, totals };
}

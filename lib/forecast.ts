import { prisma } from "@/lib/db";
import {
  monthKey,
  yearMonths,
  computeForecastTotals,
  effectiveCotisationRate,
  type ForecastMonth,
} from "@/lib/forecast-calc";

export * from "@/lib/forecast-calc";

export async function getForecastSummary(userId: string, year: number = new Date().getFullYear()) {
  const [user, entries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { cotisationRate: true, acreEligible: true } }),
    prisma.forecastEntry.findMany({ where: { userId } }),
  ]);

  const entriesByKey = new Map(entries.map((e) => [monthKey(e.month), e]));
  const acreEligible = user?.acreEligible ?? false;
  const rate = effectiveCotisationRate(user?.cotisationRate ?? 0, acreEligible);

  const months: ForecastMonth[] = yearMonths(year).map((month) => {
    const key = monthKey(month);
    const entry = entriesByKey.get(key);
    return {
      month: key,
      revenue: entry?.revenue ?? 0,
      expenses: entry?.expenses ?? 0,
    };
  });

  const totals = computeForecastTotals(months, rate);

  return { year, rate, acreEligible, months, totals };
}

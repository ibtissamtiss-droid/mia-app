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

export type ForecastMonth = { month: string; revenue: number; expenses: number };

export function effectiveCotisationRate(rate: number, acreEligible: boolean) {
  return acreEligible ? rate / 2 : rate;
}

export function computeForecastTotals(months: ForecastMonth[], rate: number) {
  const totals = months.reduce(
    (acc, m) => ({ revenue: acc.revenue + m.revenue, expenses: acc.expenses + m.expenses }),
    { revenue: 0, expenses: 0 }
  );
  const cotisations = totals.revenue * (rate / 100);
  const net = totals.revenue - totals.expenses - cotisations;
  return { ...totals, cotisations, net };
}

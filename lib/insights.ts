import { prisma } from "@/lib/db";
import { documentTotals, type BillingDocument } from "@/types/models";
import { getForecastSummary } from "@/lib/forecast";

const STALE_PROSPECT_DAYS = 14;

function daysAgo(date: Date, now: Date) {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getBusinessSnapshot(userId: string) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [invoices, prospects, tasks, forecast, user, businessPlan] = await Promise.all([
    prisma.document.findMany({
      where: { userId, type: "INVOICE" },
      include: { items: true },
    }),
    prisma.prospect.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    getForecastSummary(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { cotisationRate: true } }),
    prisma.businessPlan.findUnique({ where: { userId } }),
  ]);

  const overdueInvoices = invoices.filter(
    (d) => d.status !== "PAID" && d.status !== "CANCELLED" && d.dueDate && d.dueDate < now
  );
  const revenueInRange = (start: Date, end: Date) =>
    invoices
      .filter((d) => d.status === "PAID" && d.issueDate >= start && d.issueDate < end)
      .reduce((sum, d) => sum + documentTotals(d as unknown as BillingDocument).total, 0);
  const revenueThisMonth = revenueInRange(thisMonthStart, now);
  const revenueLastMonth = revenueInRange(lastMonthStart, thisMonthStart);

  const staleProspects = prospects.filter(
    (p) =>
      ["TO_CONTACT", "CONTACTED", "IN_DISCUSSION"].includes(p.status) &&
      daysAgo(p.updatedAt, now) >= STALE_PROSPECT_DAYS
  );
  const activeProspectsByStatus = prospects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const overdueTasks = tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && t.dueDate < now
  );

  const monthsWithNoRevenuePlanned = forecast.months.filter((m) => m.revenue === 0).length;

  const lines = [
    `Factures en retard de paiement: ${overdueInvoices.length}`,
    `Chiffre d'affaires encaissé ce mois-ci: ${revenueThisMonth.toFixed(2)}€ (mois précédent: ${revenueLastMonth.toFixed(2)}€)`,
    `Prospects par statut: ${JSON.stringify(activeProspectsByStatus)}`,
    `Prospects sans relance depuis plus de ${STALE_PROSPECT_DAYS} jours: ${staleProspects.length}`,
    `Tâches en retard: ${overdueTasks.length}`,
    `Taux de cotisation configuré: ${user?.cotisationRate ? `${user.cotisationRate}%` : "non configuré"}`,
    `Mois sans revenu prévu dans le prévisionnel (sur 12): ${monthsWithNoRevenuePlanned}`,
    `Business plan créé: ${businessPlan ? "oui" : "non"}`,
  ];

  return { summary: lines.join("\n") };
}

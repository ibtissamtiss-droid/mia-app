import { prisma } from "@/lib/db";
import { documentTotals, type BillingDocument } from "@/types/models";
import { computeRates } from "@/lib/pricing";
import { getForecastSummary } from "@/lib/forecast";

export async function buildUserContext(userId: string): Promise<string> {
  const now = new Date();

  const [user, openTasks, upcomingEvents, recentNotes, prospects, documents, pricingSettings, businessPlan, forecast] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, companyName: true, cotisationRate: true, acreEligible: true },
      }),
      prisma.task.findMany({
        where: { userId, status: { not: "DONE" } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.event.findMany({
        where: { userId, startTime: { gte: now } },
        orderBy: { startTime: "asc" },
        take: 3,
      }),
      prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { title: true },
      }),
      prisma.prospect.findMany({ where: { userId }, select: { status: true } }),
      prisma.document.findMany({ where: { userId }, include: { items: true } }),
      prisma.pricingSettings.findUnique({ where: { userId } }),
      prisma.businessPlan.findUnique({ where: { userId } }),
      getForecastSummary(userId),
    ]);

  const lines: string[] = [];

  lines.push(
    `Utilisateur: ${user?.name ?? "?"}${user?.companyName ? ` — entreprise: ${user.companyName}` : ""}`
  );
  lines.push(
    `Taux de cotisation: ${user?.cotisationRate ?? 0}%${user?.acreEligible ? " (ACRE actif, -50% la 1ère année)" : ""}`
  );

  if (openTasks.length > 0) {
    lines.push("Tâches en cours (les plus proches):");
    for (const t of openTasks) {
      const due = t.dueDate ? ` — échéance ${t.dueDate.toLocaleDateString("fr-FR")}` : "";
      lines.push(`- ${t.title}${due} [priorité ${t.priority}]`);
    }
  } else {
    lines.push("Aucune tâche en attente.");
  }

  if (upcomingEvents.length > 0) {
    lines.push("Prochains événements:");
    for (const e of upcomingEvents) {
      lines.push(`- ${e.title} le ${e.startTime.toLocaleString("fr-FR")}`);
    }
  }

  if (recentNotes.length > 0) {
    lines.push(`Notes récentes: ${recentNotes.map((n) => n.title).join(", ")}`);
  }

  if (prospects.length > 0) {
    const byStatus = prospects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
    const summary = Object.entries(byStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ");
    lines.push(`Prospects (${prospects.length} au total): ${summary}`);
  }

  const quotes = documents.filter((d) => d.type === "QUOTE");
  const invoices = documents.filter((d) => d.type === "INVOICE");
  const unpaidInvoices = invoices.filter((d) => d.status !== "PAID" && d.status !== "CANCELLED");
  const unpaidTotal = unpaidInvoices.reduce(
    (sum, d) => sum + documentTotals(d as unknown as BillingDocument).total,
    0
  );
  const paidTotal = invoices
    .filter((d) => d.status === "PAID")
    .reduce((sum, d) => sum + documentTotals(d as unknown as BillingDocument).total, 0);
  lines.push(
    `Devis: ${quotes.length}. Factures: ${invoices.length} (${unpaidInvoices.length} impayée(s) pour ${unpaidTotal.toFixed(2)} €, ${paidTotal.toFixed(2)} € encaissés).`
  );

  if (pricingSettings) {
    const rates = computeRates(pricingSettings, user?.cotisationRate ?? 0);
    lines.push(
      `Tarifs configurés: TJM ${rates.dailyRate.toFixed(0)} €, taux horaire ${rates.hourlyRate.toFixed(0)} €.`
    );
  }

  if (businessPlan) {
    lines.push(`Business plan "${businessPlan.projectName}": ${businessPlan.summary.slice(0, 300)}`);
  }

  lines.push(
    `Prévisionnel ${forecast.year}: CA prévu ${forecast.totals.revenue.toFixed(0)} €, dépenses ${forecast.totals.expenses.toFixed(0)} €, net estimé ${forecast.totals.net.toFixed(0)} €.`
  );

  return lines.join("\n");
}

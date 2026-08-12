import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentTotals, type BillingDocument } from "@/types/models";
import { startOfMonth, startOfQuarter, startOfYear } from "@/lib/dates";
import { effectiveCotisationRate } from "@/lib/forecast-calc";
import { declarationPeriodRange, periodLabel, nextDeclarationDeadline, type UrssafPeriod } from "@/lib/urssaf";
import { revenueBetween } from "@/lib/insights";

async function revenueSince(userId: string, since: Date) {
  const invoices = await prisma.document.findMany({
    where: { userId, type: "INVOICE", status: "PAID", issueDate: { gte: since } },
    include: { items: true },
  });
  return invoices.reduce(
    (sum, doc) => sum + documentTotals(doc as unknown as BillingDocument).total,
    0
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cotisationRate: true, acreEligible: true, urssafPeriod: true, urssafDeclarationDay: true },
  });

  const now = new Date();
  const declarationRange = declarationPeriodRange(user?.urssafPeriod ?? "MONTHLY", now);
  const [month, quarter, year, declarationRevenue] = await Promise.all([
    revenueSince(session.user.id, startOfMonth(now)),
    revenueSince(session.user.id, startOfQuarter(now)),
    revenueSince(session.user.id, startOfYear(now)),
    revenueBetween(session.user.id, declarationRange.start, declarationRange.end),
  ]);

  const rate = user?.cotisationRate ?? 0;
  const acreEligible = user?.acreEligible ?? false;
  const declaration = {
    period: user?.urssafPeriod ?? ("MONTHLY" as UrssafPeriod),
    declarationDay: user?.urssafDeclarationDay ?? null,
    periodLabel: periodLabel(user?.urssafPeriod ?? "MONTHLY", declarationRange),
    revenue: declarationRevenue,
    amountDue: declarationRevenue * (effectiveCotisationRate(rate, acreEligible) / 100),
    nextDeadline: user?.urssafDeclarationDay
      ? nextDeclarationDeadline(user.urssafDeclarationDay, now).toISOString()
      : null,
  };

  return NextResponse.json({
    rate,
    acreEligible,
    revenue: { month, quarter, year },
    declaration,
  });
}

const patchSchema = z.object({
  rate: z.number().min(0).max(100).optional(),
  acreEligible: z.boolean().optional(),
  urssafPeriod: z.enum(["MONTHLY", "QUARTERLY"]).optional(),
  urssafDeclarationDay: z.number().int().min(1).max(28).nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

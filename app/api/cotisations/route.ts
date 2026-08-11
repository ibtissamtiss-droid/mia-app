import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentTotals, type BillingDocument } from "@/types/models";
import { startOfMonth, startOfQuarter, startOfYear } from "@/lib/dates";

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
    select: { cotisationRate: true, acreEligible: true },
  });

  const now = new Date();
  const [month, quarter, year] = await Promise.all([
    revenueSince(session.user.id, startOfMonth(now)),
    revenueSince(session.user.id, startOfQuarter(now)),
    revenueSince(session.user.id, startOfYear(now)),
  ]);

  return NextResponse.json({
    rate: user?.cotisationRate ?? 0,
    acreEligible: user?.acreEligible ?? false,
    revenue: { month, quarter, year },
  });
}

const patchSchema = z.object({
  rate: z.number().min(0).max(100).optional(),
  acreEligible: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || (parsed.data.rate === undefined && parsed.data.acreEligible === undefined)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.rate !== undefined && { cotisationRate: parsed.data.rate }),
      ...(parsed.data.acreEligible !== undefined && { acreEligible: parsed.data.acreEligible }),
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentTotals, type BillingDocument } from "@/types/models";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfQuarter(d: Date) {
  const quarterMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), quarterMonth, 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

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
    select: { cotisationRate: true },
  });

  const now = new Date();
  const [month, quarter, year] = await Promise.all([
    revenueSince(session.user.id, startOfMonth(now)),
    revenueSince(session.user.id, startOfQuarter(now)),
    revenueSince(session.user.id, startOfYear(now)),
  ]);

  return NextResponse.json({
    rate: user?.cotisationRate ?? 0,
    revenue: { month, quarter, year },
  });
}

const rateSchema = z.object({ rate: z.number().min(0).max(100) });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = rateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Taux invalide" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { cotisationRate: parsed.data.rate },
  });

  return NextResponse.json({ ok: true });
}

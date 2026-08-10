import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const MONTHS_AHEAD = 12;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthStart(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function nextMonths(count: number) {
  const now = new Date();
  const months: Date[] = [];
  for (let i = 0; i < count; i++) {
    const year = now.getFullYear();
    const monthIndex = now.getMonth() + i;
    months.push(monthStart(year, monthIndex));
  }
  return months;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [user, entries] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { cotisationRate: true } }),
    prisma.forecastEntry.findMany({ where: { userId: session.user.id } }),
  ]);

  const entriesByKey = new Map(entries.map((e) => [monthKey(e.month), e]));

  const months = nextMonths(MONTHS_AHEAD).map((month) => {
    const key = monthKey(month);
    const entry = entriesByKey.get(key);
    return {
      month: key,
      revenue: entry?.revenue ?? 0,
      expenses: entry?.expenses ?? 0,
    };
  });

  return NextResponse.json({ rate: user?.cotisationRate ?? 0, months });
}

const patchSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  revenue: z.number().min(0),
  expenses: z.number().min(0),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { month, revenue, expenses } = parsed.data;
  const [year, monthNum] = month.split("-").map(Number);
  const monthDate = monthStart(year, monthNum - 1);

  const entry = await prisma.forecastEntry.upsert({
    where: { userId_month: { userId: session.user.id, month: monthDate } },
    create: { userId: session.user.id, month: monthDate, revenue, expenses },
    update: { revenue, expenses },
  });

  return NextResponse.json({ entry: { month, revenue: entry.revenue, expenses: entry.expenses } });
}

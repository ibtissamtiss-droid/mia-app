import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getForecastSummary, monthStart } from "@/lib/forecast";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { rate, acreEligible, months } = await getForecastSummary(session.user.id);
  return NextResponse.json({ rate, acreEligible, months });
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

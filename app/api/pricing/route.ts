import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [settings, user] = await Promise.all([
    prisma.pricingSettings.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { cotisationRate: true } }),
  ]);

  return NextResponse.json({
    settings: settings ?? {
      targetNetIncome: 0,
      workingDaysPerMonth: 18,
      hoursPerDay: 7,
      monthlyExpenses: 0,
    },
    cotisationRate: user?.cotisationRate ?? 0,
  });
}

const patchSchema = z.object({
  targetNetIncome: z.number().min(0).optional(),
  workingDaysPerMonth: z.number().min(0.1).max(31).optional(),
  hoursPerDay: z.number().min(0.1).max(24).optional(),
  monthlyExpenses: z.number().min(0).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const settings = await prisma.pricingSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ settings });
}

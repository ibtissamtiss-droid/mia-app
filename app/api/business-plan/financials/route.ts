import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const lineItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  amount: z.number().min(0),
});

const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
  monthlyVolume: z.number().min(0),
});

const bodySchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("startupCosts"), items: z.array(lineItemSchema).max(50) }),
  z.object({ section: z.literal("financingSources"), items: z.array(lineItemSchema).max(50) }),
  z.object({ section: z.literal("monthlyCharges"), items: z.array(lineItemSchema).max(50) }),
  z.object({ section: z.literal("productMargins"), items: z.array(productSchema).max(50) }),
]);

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = session.user.id;

  const [startupCosts, financingSources, monthlyCharges, productMargins, user] = await Promise.all([
    prisma.startupCost.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.financingSource.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.monthlyCharge.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.productMargin.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { cotisationRate: true, acreEligible: true } }),
  ]);

  return NextResponse.json({
    startupCosts,
    financingSources,
    monthlyCharges,
    productMargins,
    rate: user?.cotisationRate ?? 0,
    acreEligible: user?.acreEligible ?? false,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = session.user.id;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { section, items } = parsed.data;

  if (section === "startupCosts") {
    await prisma.startupCost.deleteMany({ where: { userId } });
    if (items.length) {
      await prisma.startupCost.createMany({
        data: items.map((item, position) => ({ ...item, userId, position })),
      });
    }
    const saved = await prisma.startupCost.findMany({ where: { userId }, orderBy: { position: "asc" } });
    return NextResponse.json({ items: saved });
  }

  if (section === "financingSources") {
    await prisma.financingSource.deleteMany({ where: { userId } });
    if (items.length) {
      await prisma.financingSource.createMany({
        data: items.map((item, position) => ({ ...item, userId, position })),
      });
    }
    const saved = await prisma.financingSource.findMany({ where: { userId }, orderBy: { position: "asc" } });
    return NextResponse.json({ items: saved });
  }

  if (section === "monthlyCharges") {
    await prisma.monthlyCharge.deleteMany({ where: { userId } });
    if (items.length) {
      await prisma.monthlyCharge.createMany({
        data: items.map((item, position) => ({ ...item, userId, position })),
      });
    }
    const saved = await prisma.monthlyCharge.findMany({ where: { userId }, orderBy: { position: "asc" } });
    return NextResponse.json({ items: saved });
  }

  await prisma.productMargin.deleteMany({ where: { userId } });
  if (items.length) {
    await prisma.productMargin.createMany({
      data: items.map((item, position) => ({ ...item, userId, position })),
    });
  }
  const saved = await prisma.productMargin.findMany({ where: { userId }, orderBy: { position: "asc" } });
  return NextResponse.json({ items: saved });
}

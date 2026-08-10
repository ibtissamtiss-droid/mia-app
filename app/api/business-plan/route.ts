import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const plan = await prisma.businessPlan.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ plan });
}

const patchSchema = z.object({
  projectName: z.string().trim().min(1).max(200).optional(),
  summary: z.string().trim().min(1).optional(),
  presentation: z.string().trim().min(1).optional(),
  offer: z.string().trim().min(1).optional(),
  market: z.string().trim().min(1).optional(),
  strategy: z.string().trim().min(1).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const existing = await prisma.businessPlan.findUnique({ where: { userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Aucun business plan" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const plan = await prisma.businessPlan.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ plan });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await prisma.businessPlan.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

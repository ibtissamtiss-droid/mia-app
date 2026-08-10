import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({ done: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const step = await prisma.actionPlanStep.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!step || step.plan.userId !== session.user.id) {
    return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const updated = await prisma.actionPlanStep.update({
    where: { id },
    data: { done: parsed.data.done },
  });

  return NextResponse.json({ step: updated });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const plan = await prisma.actionPlan.findUnique({
    where: { userId: session.user.id },
    include: { steps: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ plan });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await prisma.actionPlan.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await prisma.googleAccount.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

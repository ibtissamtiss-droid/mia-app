import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const account = await prisma.googleAccount.findUnique({
    where: { userId: session.user.id },
    select: { email: true },
  });

  return NextResponse.json({ connected: !!account, email: account?.email ?? null });
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const [user, accounts, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { bridgeLastSyncAt: true } }),
    prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.bankTransaction.findMany({
      where: { bankAccount: { userId: session.user.id } },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return Response.json({
    lastSyncAt: user?.bridgeLastSyncAt ?? null,
    accounts,
    transactions,
  });
}

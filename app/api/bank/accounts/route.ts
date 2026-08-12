import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentTotals } from "@/types/models";
import { findMatchingInvoice, type MatchableInvoice } from "@/lib/bank-matching";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const [user, accounts, transactions, sentInvoices] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { bridgeLastSyncAt: true } }),
    prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.bankTransaction.findMany({
      where: { bankAccount: { userId: session.user.id } },
      orderBy: { date: "desc" },
      take: 30,
      include: { matchedDocument: { select: { id: true, number: true, clientName: true } } },
    }),
    prisma.document.findMany({
      where: { userId: session.user.id, type: "INVOICE", status: "SENT" },
      include: { items: true },
    }),
  ]);

  const candidates: MatchableInvoice[] = sentInvoices.map((doc) => ({
    id: doc.id,
    number: doc.number,
    clientName: doc.clientName,
    total: documentTotals(doc).total,
  }));

  const enrichedTransactions = transactions.map((tx) => {
    if (tx.matchedDocument) {
      return { ...tx, suggestedMatch: null };
    }
    const suggestion = findMatchingInvoice(tx.amount, candidates);
    return { ...tx, suggestedMatch: suggestion };
  });

  return Response.json({
    lastSyncAt: user?.bridgeLastSyncAt ?? null,
    accounts,
    transactions: enrichedTransactions,
  });
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { listAccounts, listTransactions } from "@/lib/bridge";

export async function POST() {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bridgeUserUuid: true, bridgeLastSyncAt: true },
  });
  if (!user?.bridgeUserUuid) {
    return new Response("Connectez d'abord votre banque", { status: 400 });
  }

  try {
    const accounts = await listAccounts(user.bridgeUserUuid);
    for (const account of accounts) {
      await prisma.bankAccount.upsert({
        where: { bridgeAccountId: String(account.id) },
        create: {
          userId: session.user.id,
          bridgeAccountId: String(account.id),
          bridgeItemId: String(account.item_id),
          name: account.name,
          type: account.type,
          iban: account.iban,
          balance: account.balance,
          currencyCode: account.currency_code,
        },
        update: {
          name: account.name,
          type: account.type,
          iban: account.iban,
          balance: account.balance,
          currencyCode: account.currency_code,
        },
      });
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true, bridgeAccountId: true },
    });
    const accountIdByBridgeId = new Map(bankAccounts.map((a) => [a.bridgeAccountId, a.id]));

    const transactions = await listTransactions(user.bridgeUserUuid, user.bridgeLastSyncAt ?? undefined);
    let transactionsSynced = 0;
    for (const tx of transactions) {
      const bankAccountId = accountIdByBridgeId.get(String(tx.account_id));
      if (!bankAccountId) continue;
      await prisma.bankTransaction.upsert({
        where: { bridgeTransactionId: String(tx.id) },
        create: {
          bankAccountId,
          bridgeTransactionId: String(tx.id),
          description: tx.clean_description,
          amount: tx.amount,
          date: new Date(tx.date),
          currencyCode: tx.currency_code,
        },
        update: {
          description: tx.clean_description,
          amount: tx.amount,
          date: new Date(tx.date),
        },
      });
      transactionsSynced += 1;
    }

    await prisma.user.update({ where: { id: session.user.id }, data: { bridgeLastSyncAt: new Date() } });

    return Response.json({ accounts: accounts.length, transactions: transactionsSynced });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur de synchronisation", { status: 502 });
  }
}

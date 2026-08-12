import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const body = await req.json();
  const { transactionId, documentId } = body as { transactionId?: string; documentId?: string };
  if (!transactionId || !documentId) {
    return new Response("transactionId et documentId requis", { status: 400 });
  }

  const [transaction, document] = await Promise.all([
    prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      include: { bankAccount: true },
    }),
    prisma.document.findUnique({ where: { id: documentId } }),
  ]);
  if (!transaction || transaction.bankAccount.userId !== session.user.id) {
    return new Response("Transaction introuvable", { status: 404 });
  }
  if (!document || document.userId !== session.user.id) {
    return new Response("Facture introuvable", { status: 404 });
  }

  await prisma.$transaction([
    prisma.bankTransaction.update({ where: { id: transactionId }, data: { matchedDocumentId: documentId } }),
    prisma.document.update({ where: { id: documentId }, data: { status: "PAID" } }),
  ]);

  return Response.json({ ok: true });
}

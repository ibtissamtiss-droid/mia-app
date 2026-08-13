import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildFacturXPdf } from "@/lib/documents/facturx-pdf";
import { validateFacturX, submitInvoice } from "@/lib/superpdp";
import { isPaidUser } from "@/lib/plan";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });
  if (!(await isPaidUser(session.user.id))) {
    return new Response("La facturation électronique fait partie de la formule Pro", { status: 402 });
  }

  const { id } = await params;
  const pdf = await buildFacturXPdf(id, session.user.id);
  if (!pdf.ok) {
    return new Response(pdf.message, { status: pdf.status });
  }

  try {
    const validation = await validateFacturX(pdf.bytes, `${pdf.number}.pdf`);
    if (!validation.isValid) {
      return Response.json(
        { error: "La facture n'est pas conforme, corrigez-la avant de l'envoyer.", failures: validation.failures },
        { status: 422 }
      );
    }

    const result = await submitInvoice(pdf.bytes);

    const document = await prisma.document.update({
      where: { id },
      data: {
        superpdpInvoiceId: result.invoiceId,
        superpdpSentAt: new Date(),
        superpdpCompanyName: result.companyName,
      },
    });

    return Response.json({
      invoiceId: result.invoiceId,
      companyName: result.companyName,
      sentAt: document.superpdpSentAt,
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur d'envoi", { status: 502 });
  }
}

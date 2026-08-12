import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, embedFacturX } from "@cantoo/pdf-lib";
import { prisma } from "@/lib/db";
import { DocumentPdf } from "@/lib/documents/pdf-document";
import { buildFacturXXml } from "@/lib/documents/factur-x-xml";
import type { BillingDocument } from "@/types/models";

export type FacturXResult =
  | { ok: true; bytes: Uint8Array; number: string }
  | { ok: false; status: number; message: string };

export async function buildFacturXPdf(documentId: string, userId: string): Promise<FacturXResult> {
  const [document, user] = await Promise.all([
    prisma.document.findUnique({
      where: { id: documentId },
      include: { items: { orderBy: { position: "asc" } } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, companyName: true, companyAddress: true, siren: true, vatApplicable: true },
    }),
  ]);
  if (!document || document.userId !== userId) {
    return { ok: false, status: 404, message: "Document introuvable" };
  }
  if (document.type !== "INVOICE") {
    return { ok: false, status: 400, message: "La facturation électronique ne s'applique qu'aux factures" };
  }
  const sellerName = user?.companyName || user?.name || "";
  if (!user?.siren || !sellerName) {
    return {
      ok: false,
      status: 400,
      message: "Renseignez votre nom/raison sociale et votre SIREN dans Paramètres avant de générer une facture électronique",
    };
  }

  const billingDocument = JSON.parse(JSON.stringify(document)) as BillingDocument;
  const seller = {
    name: user.name ?? null,
    companyName: user.companyName ?? null,
    companyAddress: user.companyAddress ?? null,
    siren: user.siren ?? null,
    vatApplicable: user.vatApplicable ?? false,
  };

  const visualPdf = await renderToBuffer(<DocumentPdf document={billingDocument} seller={seller} />);

  const xml = buildFacturXXml({
    number: document.number,
    issueDate: document.issueDate,
    dueDate: document.dueDate,
    taxRate: document.taxRate,
    vatApplicable: user.vatApplicable ?? false,
    lines: document.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    seller: { name: sellerName, address: user.companyAddress, siren: user.siren },
    buyer: { name: document.clientName, address: document.clientAddress },
  });

  const pdfDoc = await PDFDocument.load(visualPdf);
  await embedFacturX(pdfDoc, new TextEncoder().encode(xml), {
    conformanceLevel: "EN 16931",
    fileName: "factur-x.xml",
  });
  const bytes = await pdfDoc.save();

  return { ok: true, bytes, number: document.number };
}

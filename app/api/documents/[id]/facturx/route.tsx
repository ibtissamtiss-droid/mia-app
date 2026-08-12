import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, embedFacturX } from "@cantoo/pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DocumentPdf } from "@/lib/documents/pdf-document";
import { buildFacturXXml } from "@/lib/documents/factur-x-xml";
import type { BillingDocument } from "@/types/models";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const [document, user] = await Promise.all([
    prisma.document.findUnique({
      where: { id },
      include: { items: { orderBy: { position: "asc" } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, companyName: true, companyAddress: true, siren: true, vatApplicable: true },
    }),
  ]);
  if (!document || document.userId !== session.user.id) {
    return new Response("Document introuvable", { status: 404 });
  }
  if (document.type !== "INVOICE") {
    return new Response("La facturation électronique ne s'applique qu'aux factures", { status: 400 });
  }
  const sellerName = user?.companyName || user?.name || "";
  if (!user?.siren || !sellerName) {
    return new Response(
      "Renseignez votre nom/raison sociale et votre SIREN dans Paramètres avant de générer une facture électronique",
      { status: 400 }
    );
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
  const facturXBytes = await pdfDoc.save();

  return new Response(new Uint8Array(facturXBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.number.replace(/[^a-z0-9]+/gi, "-")}-facturx.pdf"`,
    },
  });
}

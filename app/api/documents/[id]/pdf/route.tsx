import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DocumentPdf } from "@/lib/documents/pdf-document";
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

  const buffer = await renderToBuffer(
    <DocumentPdf
      document={JSON.parse(JSON.stringify(document)) as BillingDocument}
      seller={{
        name: user?.name ?? null,
        companyName: user?.companyName ?? null,
        companyAddress: user?.companyAddress ?? null,
        siren: user?.siren ?? null,
        vatApplicable: user?.vatApplicable ?? false,
      }}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.number}.pdf"`,
    },
  });
}

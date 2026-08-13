import { auth } from "@/auth";
import { buildFacturXPdf } from "@/lib/documents/facturx-pdf";
import { isPaidUser } from "@/lib/plan";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });
  if (!(await isPaidUser(session.user.id))) {
    return new Response("La facturation électronique fait partie de la formule Pro", { status: 402 });
  }

  const { id } = await params;
  const result = await buildFacturXPdf(id, session.user.id);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }

  return new Response(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.number.replace(/[^a-z0-9]+/gi, "-")}-facturx.pdf"`,
    },
  });
}

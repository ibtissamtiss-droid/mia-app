import { auth } from "@/auth";
import { buildFacturXPdf } from "@/lib/documents/facturx-pdf";
import { validateFacturX } from "@/lib/superpdp";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const pdf = await buildFacturXPdf(id, session.user.id);
  if (!pdf.ok) {
    return new Response(pdf.message, { status: pdf.status });
  }

  try {
    const report = await validateFacturX(pdf.bytes, `${pdf.number}.pdf`);
    return Response.json(report);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erreur de validation", { status: 502 });
  }
}

import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getForecastSummary } from "@/lib/forecast";
import { BusinessPlanPdf } from "@/lib/documents/business-plan-pdf";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });

  const plan = await prisma.businessPlan.findUnique({ where: { userId: session.user.id } });
  if (!plan) return new Response("Aucun business plan", { status: 404 });

  const forecast = await getForecastSummary(session.user.id);

  const buffer = await renderToBuffer(<BusinessPlanPdf plan={plan} forecast={forecast} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${plan.projectName.replace(/[^a-z0-9]+/gi, "-")}-business-plan.pdf"`,
    },
  });
}

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

  const userId = session.user.id;
  const [forecast, startupCosts, financingSources, monthlyCharges, productMargins, user] = await Promise.all([
    getForecastSummary(userId),
    prisma.startupCost.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.financingSource.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.monthlyCharge.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.productMargin.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { cotisationRate: true, acreEligible: true } }),
  ]);

  const financials = {
    startupCosts,
    financingSources,
    monthlyCharges,
    productMargins,
    rate: user?.cotisationRate ?? 0,
    acreEligible: user?.acreEligible ?? false,
  };

  const buffer = await renderToBuffer(
    <BusinessPlanPdf plan={plan} forecast={forecast} financials={financials} />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${plan.projectName.replace(/[^a-z0-9]+/gi, "-")}-business-plan.pdf"`,
    },
  });
}

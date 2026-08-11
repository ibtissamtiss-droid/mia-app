import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentTotals, type BillingDocument } from "@/types/models";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const invoices = await prisma.document.findMany({
    where: { userId: session.user.id, type: "INVOICE" },
    include: { items: true },
  });

  const totalFor = (predicate: (d: (typeof invoices)[number]) => boolean) =>
    invoices
      .filter(predicate)
      .reduce((sum, d) => sum + documentTotals(d as unknown as BillingDocument).total, 0);

  return NextResponse.json({
    invoiced: totalFor(() => true),
    paid: totalFor((d) => d.status === "PAID"),
    pending: totalFor((d) => d.status === "SENT"),
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyName: true, companyAddress: true, siren: true, vatApplicable: true },
  });

  return NextResponse.json({
    companyName: user?.companyName ?? "",
    companyAddress: user?.companyAddress ?? "",
    siren: user?.siren ?? "",
    vatApplicable: user?.vatApplicable ?? false,
  });
}

const companySchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  companyAddress: z.string().trim().max(500).optional(),
  siren: z
    .string()
    .trim()
    .regex(/^$|^\d{9}$/, "Le SIREN doit contenir 9 chiffres")
    .optional(),
  vatApplicable: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = companySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { prospectSchema } from "@/lib/validators/prospect";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = prospectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prospect = await prisma.prospect.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ prospect });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  await prisma.prospect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

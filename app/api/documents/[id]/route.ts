import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentSchema } from "@/lib/validators/document";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!document || document.userId !== session.user.id) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = documentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, clientEmail, clientSiren, dueDate, issueDate, ...rest } = parsed.data;

  const document = await prisma.document.update({
    where: { id },
    data: {
      ...rest,
      ...(clientEmail !== undefined ? { clientEmail: clientEmail || null } : {}),
      ...(clientSiren !== undefined ? { clientSiren: clientSiren || null } : {}),
      ...(issueDate !== undefined ? { issueDate: new Date(issueDate) } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(items
        ? {
            items: {
              deleteMany: {},
              create: items.map((item, index) => ({ ...item, position: index })),
            },
          }
        : {}),
    },
    include: { items: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ document });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

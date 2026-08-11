import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentSchema } from "@/lib/validators/document";
import { generateDocumentNumber } from "@/lib/documents/number";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);

  const documents = await prisma.document.findMany({
    where: {
      userId: session.user.id,
      ...(type === "QUOTE" || type === "INVOICE" ? { type } : {}),
    },
    include: { items: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: PAGE_SIZE + 1,
  });

  const hasMore = documents.length > PAGE_SIZE;
  return NextResponse.json({ documents: documents.slice(0, PAGE_SIZE), hasMore });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, clientEmail, dueDate, issueDate, ...rest } = parsed.data;
  const number = await generateDocumentNumber(session.user.id, rest.type);

  const document = await prisma.document.create({
    data: {
      ...rest,
      number,
      clientEmail: clientEmail || null,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: session.user.id,
      items: {
        create: items.map((item, index) => ({ ...item, position: index })),
      },
    },
    include: { items: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ document }, { status: 201 });
}

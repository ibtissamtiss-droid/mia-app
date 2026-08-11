import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { noteSchema } from "@/lib/validators/note";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    skip: offset,
    take: PAGE_SIZE + 1,
  });

  const hasMore = notes.length > PAGE_SIZE;
  return NextResponse.json({ notes: notes.slice(0, PAGE_SIZE), hasMore });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: { ...parsed.data, userId: session.user.id },
  });
  return NextResponse.json({ note }, { status: 201 });
}

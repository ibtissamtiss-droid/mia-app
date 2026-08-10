import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ tasks: [], events: [], notes: [], documents: [] });
  }

  const userId = session.user.id;
  const contains = { contains: q, mode: "insensitive" as const };

  const [tasks, events, notes, documents] = await Promise.all([
    prisma.task.findMany({
      where: { userId, title: contains },
      select: { id: true, title: true, status: true },
      take: 5,
    }),
    prisma.event.findMany({
      where: { userId, title: contains },
      select: { id: true, title: true, startTime: true },
      take: 5,
    }),
    prisma.note.findMany({
      where: { userId, OR: [{ title: contains }, { content: contains }] },
      select: { id: true, title: true },
      take: 5,
    }),
    prisma.document.findMany({
      where: { userId, OR: [{ number: contains }, { clientName: contains }] },
      select: { id: true, number: true, clientName: true, type: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ tasks, events, notes, documents });
}

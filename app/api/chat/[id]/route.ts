import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.userId !== session.user.id) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.chatConversation.findUnique({ where: { id } });
  if (!conversation || conversation.userId !== session.user.id) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  await prisma.chatConversation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

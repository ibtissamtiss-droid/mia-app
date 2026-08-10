import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  }

  const response = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Résume cette note en 2-3 phrases claires et actionnables, en français:\n\n${note.content}`,
      },
    ],
  });

  const summary = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const updated = await prisma.note.update({ where: { id }, data: { summary } });
  return NextResponse.json({ note: updated });
}

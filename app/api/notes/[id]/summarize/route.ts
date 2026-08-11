import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`summarize:${session.user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return rateLimitResponse();

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Résume cette note en 2-3 phrases claires et actionnables, en français:\n\n${note.content}`,
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Échec du résumé, réessayez" }, { status: 502 });
  }

  const summary = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const updated = await prisma.note.update({ where: { id }, data: { summary } });
  return NextResponse.json({ note: updated });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  await prisma.chatMessage.create({
    data: { conversationId: id, role: "USER", content },
  });

  if (conversation.messages.length === 0 && conversation.title === "Nouvelle conversation") {
    const title = content.length > 48 ? `${content.slice(0, 48)}…` : content;
    await prisma.chatConversation.update({ where: { id }, data: { title } });
  }

  const history = [...conversation.messages, { role: "USER" as const, content }].map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  const stream = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system:
      "Tu es MIA, un assistant personnel de productivité pour professionnels. Sois concis, concret et orienté action.",
    messages: history,
    stream: true,
  });

  const encoder = new TextEncoder();
  let assistantReply = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          assistantReply += event.delta.text;
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      await prisma.chatMessage.create({
        data: { conversationId: id, role: "ASSISTANT", content: assistantReply },
      });
      await prisma.chatConversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

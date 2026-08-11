import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { buildUserContext } from "@/lib/ai/user-context";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`chat:${session.user.id}`, 30, 60 * 60 * 1000);
  if (!allowed) return rateLimitResponse();

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

  const userContext = await buildUserContext(session.user.id);

  let stream;
  try {
    stream = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system:
        "Tu es MIA, un assistant personnel de productivité pour professionnels indépendants et auto-entrepreneurs. " +
        "Sois concis, concret et orienté action. Tu as accès en lecture seule aux données réelles de l'utilisateur " +
        "ci-dessous (tâches, événements, notes, prospects, devis/factures, tarifs, business plan, prévisionnel) : " +
        "utilise-les pour répondre précisément à ses questions sur son activité, sans les recopier intégralement " +
        "si ce n'est pas demandé. Ces données peuvent être incomplètes ou dater de quelques minutes ; si une info " +
        "manque, dis-le plutôt que d'inventer. Tu ne peux pas modifier ces données depuis cette conversation.\n\n" +
        `--- Données de l'utilisateur ---\n${userContext}`,
      messages: history,
      stream: true,
    });
  } catch {
    return NextResponse.json({ error: "Échec de la réponse, réessayez" }, { status: 502 });
  }

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

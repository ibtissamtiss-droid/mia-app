import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { buildUserContext } from "@/lib/ai/user-context";
import { CHAT_TOOLS, executeChatTool } from "@/lib/ai/chat-tools";

const MAX_TOOL_ITERATIONS = 4;

const SYSTEM_PROMPT_BASE =
  "Tu es MIA, un assistant personnel de productivité pour professionnels indépendants et auto-entrepreneurs. " +
  "Sois concis, concret et orienté action. Tu as accès en lecture seule aux données réelles de l'utilisateur " +
  "ci-dessous (tâches, événements, notes, prospects, devis/factures, tarifs, business plan, prévisionnel) : " +
  "utilise-les pour répondre précisément à ses questions sur son activité, sans les recopier intégralement " +
  "si ce n'est pas demandé. Ces données peuvent être incomplètes ou dater de quelques minutes ; si une info " +
  "manque, dis-le plutôt que d'inventer. Tu disposes aussi d'outils pour créer une tâche, une note, un prospect " +
  "ou un événement au calendrier directement depuis la conversation quand l'utilisateur te le demande — utilise-les " +
  "sans demander de confirmation supplémentaire si la demande est claire, et confirme brièvement ce que tu as fait " +
  "une fois l'action effectuée. Tu ne peux ni modifier ni supprimer des données existantes, ni créer de devis ou " +
  "de facture depuis cette conversation.";

type StreamBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; inputJson: string };

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

  let messages: Anthropic.MessageParam[] = [
    ...conversation.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user", content },
  ];

  const userContext = await buildUserContext(session.user.id);
  const system = `${SYSTEM_PROMPT_BASE}\n\n--- Données de l'utilisateur ---\n${userContext}`;

  const encoder = new TextEncoder();
  const userId = session.user.id;

  const readable = new ReadableStream({
    async start(controller) {
      let assistantReply = "";

      try {
        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const stream = await anthropic.messages.create({
            model: CHAT_MODEL,
            max_tokens: 1024,
            system,
            messages,
            tools: CHAT_TOOLS,
            stream: true,
          });

          const blocks: StreamBlock[] = [];
          let stopReason: string | null = null;

          for await (const event of stream) {
            if (event.type === "content_block_start") {
              blocks[event.index] =
                event.content_block.type === "tool_use"
                  ? { type: "tool_use", id: event.content_block.id, name: event.content_block.name, inputJson: "" }
                  : { type: "text", text: "" };
            } else if (event.type === "content_block_delta") {
              const block = blocks[event.index];
              if (event.delta.type === "text_delta" && block?.type === "text") {
                block.text += event.delta.text;
                assistantReply += event.delta.text;
                controller.enqueue(encoder.encode(event.delta.text));
              } else if (event.delta.type === "input_json_delta" && block?.type === "tool_use") {
                block.inputJson += event.delta.partial_json;
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason;
            }
          }

          if (stopReason !== "tool_use") break;

          const toolUseBlocks = blocks.filter((b): b is Extract<StreamBlock, { type: "tool_use" }> =>
            b?.type === "tool_use"
          );

          const assistantContent: Anthropic.ContentBlockParam[] = blocks
            .filter((b): b is StreamBlock => !!b)
            .map((b) =>
              b.type === "text"
                ? { type: "text", text: b.text }
                : { type: "tool_use", id: b.id, name: b.name, input: JSON.parse(b.inputJson || "{}") }
            );

          const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
            toolUseBlocks.map(async (b) => {
              let parsedInput: unknown = {};
              try {
                parsedInput = JSON.parse(b.inputJson || "{}");
              } catch {
                // leave as empty object; executeChatTool will reject via schema validation
              }
              const result = await executeChatTool(userId, b.name, parsedInput);
              return { type: "tool_result", tool_use_id: b.id, content: JSON.stringify(result) };
            })
          );

          messages = [
            ...messages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];
        }
      } catch {
        // fall through and save whatever was streamed so far
      }

      if (assistantReply) {
        await prisma.chatMessage.create({
          data: { conversationId: id, role: "ASSISTANT", content: assistantReply },
        });
        await prisma.chatConversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect || prospect.userId !== session.user.id) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  const businessPlan = await prisma.businessPlan.findUnique({ where: { userId: session.user.id } });

  const businessContext = businessPlan
    ? `Mon activité: ${businessPlan.presentation}\nMon offre: ${businessPlan.offer}`
    : "Je suis freelance/indépendant.";

  const response = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 400,
    system:
      "Tu es MIA, un assistant qui aide un freelance à rédiger un message de prospection court, " +
      "personnalisé et professionnel, sans être trop commercial ni familier. " +
      "Réponds UNIQUEMENT avec le message prêt à être envoyé (pas d'objet, pas d'introduction, pas de commentaire), en français. " +
      "Adapte le ton au canal indiqué (email = un peu plus formel, LinkedIn/réseau = plus direct et court).",
    messages: [
      {
        role: "user",
        content:
          `${businessContext}\n\n` +
          `Prospect: ${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}\n` +
          `Canal: ${prospect.channel || "non précisé"}\n` +
          (prospect.notes ? `Notes sur ce prospect: ${prospect.notes}\n` : "") +
          `\nRédige un message de premier contact pour ce prospect.`,
      },
    ],
  });

  const message = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const updated = await prisma.prospect.update({
    where: { id },
    data: { outreachMessage: message },
  });

  return NextResponse.json({ prospect: updated });
}

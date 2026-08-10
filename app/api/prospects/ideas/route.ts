import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";

const bodySchema = z.object({ context: z.string().trim().max(1000).optional() });

const ideasSchema = z.object({ ideas: z.array(z.string().min(1)).min(1) });

function parseIdeas(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA invalide");
  return ideasSchema.parse(JSON.parse(jsonMatch[0])).ideas.slice(0, 8);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  let context = parsed.data.context;
  if (!context) {
    const businessPlan = await prisma.businessPlan.findUnique({ where: { userId: session.user.id } });
    if (businessPlan) {
      context = `Activité: ${businessPlan.presentation}\nOffre: ${businessPlan.offer}\nClientèle cible: ${businessPlan.market}`;
    }
  }
  if (!context) {
    return NextResponse.json(
      { error: "Décrivez votre activité, ou créez d'abord votre business plan" },
      { status: 400 }
    );
  }

  const response = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 800,
    system:
      "Tu es MIA, un assistant qui aide des freelances et indépendants à trouver de nouveaux clients. " +
      "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format exact: " +
      '{"ideas": ["idée courte et concrète", ...]}. ' +
      "Propose entre 5 et 8 pistes concrètes (canaux, plateformes, communautés, événements, types de partenariats) adaptées à l'activité décrite, en français.",
    messages: [{ role: "user", content: context }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  try {
    const ideas = parseIdeas(text);
    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json({ error: "Échec de la génération, réessayez" }, { status: 502 });
  }
}

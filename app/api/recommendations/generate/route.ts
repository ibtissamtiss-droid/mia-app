import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { getBusinessSnapshot } from "@/lib/insights";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const itemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});
const responseSchema = z.object({ recommendations: z.array(itemSchema).min(1) });

function parseRecommendations(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA invalide");
  return responseSchema.parse(JSON.parse(jsonMatch[0])).recommendations.slice(0, 8);
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`recommendations:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return rateLimitResponse();

  const { summary } = await getBusinessSnapshot(session.user.id);

  let response;
  try {
    response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1500,
      system:
        "Tu es MIA, un assistant qui aide des freelances et indépendants à développer leur activité. " +
        "On te donne un instantané des données réelles de leur activité (factures, prospects, tâches, prévisionnel). " +
        "Analyse ces données et propose des recommandations concrètes, actionnables et priorisées : " +
        "relances à faire, points d'attention administratifs ou financiers, et opportunités de développement. " +
        "Sois spécifique en te basant sur les chiffres donnés, pas générique. " +
        "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format exact: " +
        '{"recommendations": [{"title": "titre court et actionnable", "description": "1-2 phrases expliquant pourquoi et comment", "priority": "HIGH"|"MEDIUM"|"LOW"}]}. ' +
        "Propose entre 4 et 8 recommandations, en français.",
      messages: [{ role: "user", content: `Données de l'activité:\n${summary}` }],
    });
  } catch {
    return NextResponse.json({ error: "Échec de la génération, réessayez" }, { status: 502 });
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  let items: z.infer<typeof itemSchema>[];
  try {
    items = parseRecommendations(text);
  } catch {
    return NextResponse.json({ error: "Échec de la génération, réessayez" }, { status: 502 });
  }

  await prisma.recommendation.deleteMany({ where: { userId: session.user.id } });
  await prisma.recommendation.createMany({
    data: items.map((item) => ({ ...item, userId: session.user.id })),
  });

  const recommendations = await prisma.recommendation.findMany({
    where: { userId: session.user.id },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ recommendations });
}

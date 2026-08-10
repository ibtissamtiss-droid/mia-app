import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";

const bodySchema = z.object({
  projectName: z.string().trim().min(1).max(200),
  activity: z.string().trim().min(1).max(1000),
  offer: z.string().trim().min(1).max(1000),
  targetClients: z.string().trim().min(1).max(1000),
  objectives: z.string().trim().max(1000).optional(),
});

const sectionsSchema = z.object({
  summary: z.string().min(1),
  presentation: z.string().min(1),
  offer: z.string().min(1),
  market: z.string().min(1),
  strategy: z.string().min(1),
});

function parseSections(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA invalide");
  return sectionsSchema.parse(JSON.parse(jsonMatch[0]));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Merci de compléter les champs requis" }, { status: 400 });
  }
  const { projectName, activity, offer, targetClients, objectives } = parsed.data;

  const response = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 2500,
    system:
      "Tu es MIA, un assistant qui aide des indépendants et freelances à rédiger un business plan clair et concret. " +
      "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces clés (chaînes de texte en français, 2-4 paragraphes chacune, style professionnel et concret, sans markdown): " +
      '{"summary": "résumé exécutif du projet", "presentation": "présentation du projet et du porteur de projet", "offer": "description de l\'offre, produits ou services", "market": "analyse du marché cible et de la clientèle visée", "strategy": "stratégie commerciale et plan de développement"}.',
    messages: [
      {
        role: "user",
        content:
          `Nom du projet: ${projectName}\n` +
          `Activité: ${activity}\n` +
          `Offre / produits-services: ${offer}\n` +
          `Clientèle cible: ${targetClients}` +
          (objectives ? `\nObjectifs: ${objectives}` : ""),
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  let sections: z.infer<typeof sectionsSchema>;
  try {
    sections = parseSections(text);
  } catch {
    return NextResponse.json({ error: "Échec de la génération, réessayez" }, { status: 502 });
  }

  await prisma.businessPlan.deleteMany({ where: { userId: session.user.id } });
  const plan = await prisma.businessPlan.create({
    data: { userId: session.user.id, projectName, ...sections },
  });

  return NextResponse.json({ plan });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";

const bodySchema = z.object({
  goal: z.string().trim().min(1).max(500),
  context: z.string().trim().max(1000).optional(),
});

type GeneratedStep = { title: string; description?: string };

function parseSteps(text: string): GeneratedStep[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA invalide");
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.steps)) throw new Error("Réponse IA invalide");
  return parsed.steps
    .filter((s: unknown): s is GeneratedStep => !!s && typeof (s as GeneratedStep).title === "string")
    .slice(0, 12);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Objectif requis" }, { status: 400 });
  }
  const { goal, context } = parsed.data;

  const response = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1500,
    system:
      "Tu es MIA, un assistant qui aide des indépendants et freelances à construire un plan d'action concret. " +
      "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format exact: " +
      '{"steps": [{"title": "string courte et actionnable", "description": "1-2 phrases explicatives"}]}. ' +
      "Propose entre 5 et 8 étapes concrètes, réalistes et ordonnées dans le temps, en français.",
    messages: [
      {
        role: "user",
        content: `Objectif: ${goal}${context ? `\nContexte / situation actuelle: ${context}` : ""}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  let steps: GeneratedStep[];
  try {
    steps = parseSteps(text);
  } catch {
    return NextResponse.json({ error: "Échec de la génération du plan, réessayez" }, { status: 502 });
  }
  if (steps.length === 0) {
    return NextResponse.json({ error: "Échec de la génération du plan, réessayez" }, { status: 502 });
  }

  await prisma.actionPlan.deleteMany({ where: { userId: session.user.id } });
  const plan = await prisma.actionPlan.create({
    data: {
      userId: session.user.id,
      goal,
      context: context || null,
      steps: {
        create: steps.map((step, index) => ({
          title: step.title,
          description: step.description || null,
          position: index,
        })),
      },
    },
    include: { steps: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ plan });
}

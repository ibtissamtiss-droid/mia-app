import { prisma } from "@/lib/db";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { getBusinessSnapshot } from "@/lib/insights";

function todayStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

async function generate(userId: string): Promise<string> {
  const date = todayStart();
  const [{ summary }, user] = await Promise.all([
    getBusinessSnapshot(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  let content: string;
  try {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 400,
      system:
        "Tu es MIA, un assistant qui prépare le point du jour d'un indépendant ou auto-entrepreneur. " +
        "À partir des données réelles fournies, rédige un court message (3 à 5 phrases, en français, ton direct " +
        "et bienveillant, pas de markdown, pas de liste à puces) qui met en avant ce qui mérite son attention " +
        "aujourd'hui : relances en retard, factures impayées, tâches en retard, points de vigilance financiers. " +
        "Si tout est à jour, dis-le simplement et positivement plutôt que d'inventer un problème. " +
        "Ne mentionne que des faits présents dans les données fournies.",
      messages: [
        { role: "user", content: `Prénom de l'utilisateur: ${user?.name ?? "inconnu"}\n\nDonnées:\n${summary}` },
      ],
    });
    content = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!content) throw new Error("Réponse vide");
  } catch {
    content = "Impossible de préparer votre point du jour pour le moment, réessayez plus tard.";
  }

  await prisma.dailyBriefing.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, content },
    update: { content },
  });

  return content;
}

export async function getDailyBriefing(userId: string): Promise<string> {
  const date = todayStart();
  const existing = await prisma.dailyBriefing.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) return existing.content;
  return generate(userId);
}

export async function regenerateDailyBriefing(userId: string): Promise<string> {
  return generate(userId);
}

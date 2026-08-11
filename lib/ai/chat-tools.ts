import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: "Crée une nouvelle tâche pour l'utilisateur dans MIA.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titre de la tâche" },
        description: { type: "string", description: "Détails optionnels" },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH"],
          description: "Priorité, par défaut MEDIUM",
        },
        dueDate: {
          type: "string",
          description: "Date d'échéance au format ISO 8601 (YYYY-MM-DD), optionnelle",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "create_note",
    description: "Crée une nouvelle note pour l'utilisateur dans MIA.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titre de la note" },
        content: { type: "string", description: "Contenu de la note" },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "create_prospect",
    description: "Ajoute un nouveau prospect (client potentiel) dans le suivi de prospection de l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du prospect ou du contact" },
        company: { type: "string", description: "Entreprise du prospect, optionnel" },
        email: { type: "string", description: "Email du prospect, optionnel" },
        phone: { type: "string", description: "Téléphone du prospect, optionnel" },
        channel: { type: "string", description: "Canal de contact, ex: LinkedIn, recommandation..." },
        notes: { type: "string", description: "Notes libres sur ce prospect, optionnel" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_event",
    description: "Ajoute un événement au calendrier de l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titre de l'événement" },
        startTime: { type: "string", description: "Date et heure de début, format ISO 8601" },
        endTime: { type: "string", description: "Date et heure de fin, format ISO 8601" },
        location: { type: "string", description: "Lieu, optionnel" },
      },
      required: ["title", "startTime", "endTime"],
    },
  },
];

const isoDate = z.string().refine((v) => !isNaN(new Date(v).getTime()), "Date invalide");

const schemas = {
  create_task: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: isoDate.optional(),
  }),
  create_note: z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(10000),
  }),
  create_prospect: z.object({
    name: z.string().trim().min(1).max(200),
    company: z.string().trim().max(200).optional(),
    email: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(50).optional(),
    channel: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
  create_event: z.object({
    title: z.string().trim().min(1).max(200),
    startTime: isoDate,
    endTime: isoDate,
    location: z.string().trim().max(200).optional(),
  }),
};

export async function executeChatTool(userId: string, name: string, rawInput: unknown) {
  try {
    switch (name) {
      case "create_task": {
        const input = schemas.create_task.parse(rawInput);
        const task = await prisma.task.create({
          data: {
            userId,
            title: input.title,
            description: input.description,
            priority: input.priority ?? "MEDIUM",
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          },
        });
        return { ok: true, id: task.id, title: task.title };
      }
      case "create_note": {
        const input = schemas.create_note.parse(rawInput);
        const note = await prisma.note.create({
          data: { userId, title: input.title, content: input.content },
        });
        return { ok: true, id: note.id, title: note.title };
      }
      case "create_prospect": {
        const input = schemas.create_prospect.parse(rawInput);
        const prospect = await prisma.prospect.create({
          data: {
            userId,
            name: input.name,
            company: input.company,
            email: input.email,
            phone: input.phone,
            channel: input.channel,
            notes: input.notes,
          },
        });
        return { ok: true, id: prospect.id, name: prospect.name };
      }
      case "create_event": {
        const input = schemas.create_event.parse(rawInput);
        const event = await prisma.event.create({
          data: {
            userId,
            title: input.title,
            startTime: new Date(input.startTime),
            endTime: new Date(input.endTime),
            location: input.location,
          },
        });
        return { ok: true, id: event.id, title: event.title };
      }
      default:
        return { ok: false, error: "Outil inconnu" };
    }
  } catch (err) {
    const message = err instanceof z.ZodError ? "Données invalides" : "Échec de l'exécution";
    return { ok: false, error: message };
  }
}

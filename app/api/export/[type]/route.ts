import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { documentTotals, type BillingDocument } from "@/types/models";

const STATUS_LABEL_TASK: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
};

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { type } = await params;
  const userId = session.user.id;

  let csv: string;
  let filename: string;

  if (type === "tasks") {
    const tasks = await prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    csv = toCsv(
      tasks.map((t) => ({
        titre: t.title,
        description: t.description ?? "",
        statut: STATUS_LABEL_TASK[t.status] ?? t.status,
        priorite: t.priority,
        echeance: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
      })),
      [
        { key: "titre", label: "Titre" },
        { key: "description", label: "Description" },
        { key: "statut", label: "Statut" },
        { key: "priorite", label: "Priorité" },
        { key: "echeance", label: "Échéance" },
      ]
    );
    filename = "taches.csv";
  } else if (type === "notes") {
    const notes = await prisma.note.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    csv = toCsv(
      notes.map((n) => ({
        titre: n.title,
        contenu: n.content,
        resume: n.summary ?? "",
        creee_le: n.createdAt.toISOString().slice(0, 10),
      })),
      [
        { key: "titre", label: "Titre" },
        { key: "contenu", label: "Contenu" },
        { key: "resume", label: "Résumé" },
        { key: "creee_le", label: "Créée le" },
      ]
    );
    filename = "notes.csv";
  } else if (type === "documents") {
    const documents = await prisma.document.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });
    csv = toCsv(
      documents.map((d) => {
        const { total } = documentTotals(d as unknown as BillingDocument);
        return {
          numero: d.number,
          type: d.type === "QUOTE" ? "Devis" : "Facture",
          client: d.clientName,
          statut: d.status,
          date_emission: d.issueDate.toISOString().slice(0, 10),
          total: total.toFixed(2),
        };
      }),
      [
        { key: "numero", label: "Numéro" },
        { key: "type", label: "Type" },
        { key: "client", label: "Client" },
        { key: "statut", label: "Statut" },
        { key: "date_emission", label: "Date d'émission" },
        { key: "total", label: "Total (€)" },
      ]
    );
    filename = "devis-factures.csv";
  } else {
    return NextResponse.json({ error: "Type d'export inconnu" }, { status: 400 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

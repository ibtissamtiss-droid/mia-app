import { prisma } from "@/lib/db";
import type { DocumentType } from "@/types/models";

const PREFIX: Record<DocumentType, string> = { QUOTE: "DEV", INVOICE: "FAC" };

export async function generateDocumentNumber(userId: string, type: DocumentType) {
  const count = await prisma.document.count({ where: { userId, type } });
  const year = new Date().getFullYear();
  return `${PREFIX[type]}-${year}-${String(count + 1).padStart(4, "0")}`;
}

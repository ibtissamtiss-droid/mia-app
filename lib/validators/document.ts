import { z } from "zod";

export const documentItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const documentSchema = z.object({
  type: z.enum(["QUOTE", "INVOICE"]),
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).default("DRAFT"),
  clientName: z.string().min(1, "Nom du client requis"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientAddress: z.string().optional(),
  clientSiren: z
    .string()
    .trim()
    .regex(/^$|^\d{9}$/, "Le SIREN doit contenir 9 chiffres")
    .optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  items: z.array(documentItemSchema).min(1, "Au moins une ligne est requise"),
});

export type DocumentInput = z.infer<typeof documentSchema>;
export type DocumentItemInput = z.infer<typeof documentItemSchema>;

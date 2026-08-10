import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
});

export type NoteInput = z.infer<typeof noteSchema>;

import { z } from "zod";

export const prospectSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  channel: z.string().optional(),
  status: z.enum(["TO_CONTACT", "CONTACTED", "IN_DISCUSSION", "WON", "LOST"]).default("TO_CONTACT"),
  notes: z.string().optional(),
  outreachMessage: z.string().optional(),
});

export type ProspectInput = z.infer<typeof prospectSchema>;

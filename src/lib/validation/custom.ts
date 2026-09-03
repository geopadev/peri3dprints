import { z } from "zod";

export const customRequestSchema = z.object({
  what: z.string().trim().min(10, { message: "Tell me a bit more about what you want." }).max(2000),
  sizeNote: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
  colourPref: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
  budget: z
    .string()
    .trim()
    .transform((v) => {
      if (!v) return null;
      const cents = Math.round(Number(v.replace(",", ".")) * 100);
      return Number.isFinite(cents) && cents > 0 ? cents : null;
    }),
  deadline: z
    .string()
    .trim()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
  references: z
    .array(z.object({ path: z.string(), name: z.string(), size: z.number(), type: z.string() }))
    .max(5),
});

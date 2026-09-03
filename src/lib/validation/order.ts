import { z } from "zod";

const phone = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^\+?\d{8,15}$/.test(v), { message: "Add a phone number the courier can call." });

/**
 * What "Ask to buy" needs up front, and nothing more. Delivery is not chosen
 * here: half of these people collect at a market and never need an address.
 * Prices are not here at all, the database recomputes every one.
 */
export const askToBuySchema = z.object({
  fullName: z.string().trim().min(2, { message: "Tell me who it is for." }).max(120),
  email: z.string().trim().email({ message: "That email does not look right." }),
  phone,
  note: z
    .string()
    .max(1000, { message: "Keep the note under a thousand characters." })
    .transform((v) => v.trim() || null),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, { message: "Your cart is empty." }),
});

export type AskToBuyInput = z.input<typeof askToBuySchema>;

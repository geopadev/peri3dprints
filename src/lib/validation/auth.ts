import { z } from "zod";

/**
 * One schema per form, used by the form and re-used by the Server Action, so
 * the client and the server can never disagree about what is valid.
 */
export const ownerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter the email address you use for the shop.")
    .email("That does not look like an email address."),
});

export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;

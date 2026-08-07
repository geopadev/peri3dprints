import { z } from "zod";

/** Matches the 5 MB ceiling on the chat-uploads bucket. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const MAX_ATTACHMENTS_PER_MESSAGE = 4;

export const MESSAGE_BODY_MAX = 2000;

export const attachmentSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1).max(200),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
  type: z.string().regex(/^image\//, { message: "Only images can be attached." }),
});

export type Attachment = z.infer<typeof attachmentSchema>;

/**
 * A message needs either words or a picture. Sending nothing at all is not a
 * message, and an empty row in the thread reads as a bug to the person on the
 * other end.
 */
export const sendMessageSchema = z
  .object({
    conversationId: z.string().uuid(),
    body: z
      .string()
      .max(MESSAGE_BODY_MAX, { message: "That message is too long to send." })
      .transform((value) => value.trim()),
    attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS_PER_MESSAGE).default([]),
  })
  .refine((value) => value.body.length > 0 || value.attachments.length > 0, {
    message: "Write something or add a picture first.",
    path: ["body"],
  });

export const startConversationSchema = z.object({
  body: z
    .string()
    .min(1, { message: "Write your message first." })
    .max(MESSAGE_BODY_MAX, { message: "That message is too long to send." })
    .transform((value) => value.trim()),
  productId: z.union([z.string().uuid(), z.null()]).default(null),
  subject: z
    .union([z.string(), z.null()])
    .default(null)
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed.slice(0, 120) : null;
    }),
});

/**
 * What the buyer fills in from inside the conversation. There is deliberately
 * no shipping cost here: the cost is re-quoted server side from the database
 * for whatever country is given. A cost arriving from a form is a price the
 * browser chose.
 */
export const deliveryDetailsSchema = z
  .object({
    orderId: z.string().uuid(),
    method: z.enum(["post", "collect"]),
    fullName: z
      .string()
      .max(120)
      .transform((value) => value.trim()),
    phone: z
      .string()
      .max(40)
      .transform((value) => value.trim()),
    line1: z
      .string()
      .max(160)
      .transform((value) => value.trim()),
    line2: z
      .union([z.string(), z.null()])
      .default(null)
      .transform((value) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
      }),
    city: z
      .string()
      .max(80)
      .transform((value) => value.trim()),
    postalCode: z
      .string()
      .max(20)
      .transform((value) => value.trim()),
    countryCode: z
      .string()
      .transform((value) => value.trim().toUpperCase())
      .refine((value) => value === "" || /^[A-Z]{2}$/.test(value), {
        message: "Pick a country from the list.",
      }),
  })
  .superRefine((value, ctx) => {
    // Collecting at a market needs no address at all, so only check these
    // fields when the parcel is actually going somewhere.
    if (value.method !== "post") return;

    const required: [keyof typeof value, string][] = [
      ["fullName", "Add the name the parcel goes to."],
      ["phone", "Add a phone number for the courier."],
      ["line1", "Add the street address."],
      ["city", "Add the town or city."],
      ["postalCode", "Add the postal code."],
      ["countryCode", "Pick a country from the list."],
    ];

    for (const [field, message] of required) {
      if (!value[field]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [field] });
      }
    }
  });

export type DeliveryDetailsInput = z.input<typeof deliveryDetailsSchema>;
export type DeliveryDetails = z.output<typeof deliveryDetailsSchema>;

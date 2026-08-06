import { z } from "zod";

/**
 * One schema per form, imported by the client form and re-used by the Server
 * Action, so the browser and the server can never disagree about what is valid.
 *
 * Money crosses this boundary as a plain euro string, because that is what the
 * owner types. It becomes integer cents here and stays cents everywhere after.
 */

/** "12,50" and "12.50" both mean the same thing to someone typing on a phone. */
export const euroToCents = z
  .string()
  .trim()
  .min(1, "Put a price in.")
  .transform((value) => value.replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Prices look like 12 or 12.50.",
  })
  .transform((value) => Math.round(Number(value) * 100));

/** Same, but an empty box means "no compare price" rather than an error. */
export const optionalEuroToCents = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .refine((value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Prices look like 12 or 12.50.",
  })
  .transform((value) => (value === "" ? null : Math.round(Number(value) * 100)));

const optionalPositiveInt = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
    message: "Use a whole number.",
  });

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "A product needs a web address.")
  .max(80, "That is too long for a web address.")
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes only.");

export const productStatusSchema = z.enum(["draft", "active", "archived"]);

export const productImageSchema = z.object({
  id: optionalText,
  storage_path: z.string().trim().min(1),
  // Required, because CLAUDE.md section 8 says every image carries real alt text.
  alt_text: z
    .string()
    .trim()
    .min(1, "Describe the photo so it works for screen readers and search.")
    .max(200, "Keep alt text short."),
  position: z.number().int().min(0),
});

export const productVariantSchema = z.object({
  id: optionalText,
  option_label: z.string().trim().min(1).default("Colour"),
  name: z.string().trim().min(1, "Give the option a name, like Glow green."),
  swatch_hex: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || /^#[0-9a-fA-F]{6}$/.test(value), {
      message: "Colours look like #33FF88.",
    }),
  price_delta_cents: z.number().int(),
  stock_qty: z.number().int().min(0).nullable(),
  sku: optionalText,
  position: z.number().int().min(0),
});

export const productSchema = z
  .object({
    id: optionalText,
    title: z.string().trim().min(1, "Give it a name.").max(120, "Keep the name shorter."),
    slug: slugSchema,
    short_description: optionalText,
    description: optionalText,
    price_cents: z.number().int().min(0),
    compare_at_cents: z.number().int().min(0).nullable(),
    status: productStatusSchema,

    made_to_order: z.boolean(),
    lead_time_days: optionalPositiveInt,
    stock_qty: optionalPositiveInt,

    // Spec strip fields. All optional: SpecStrip renders only what is present.
    material: optionalText,
    weight_grams: optionalPositiveInt,
    length_mm: optionalPositiveInt,
    width_mm: optionalPositiveInt,
    height_mm: optionalPositiveInt,
    print_minutes: optionalPositiveInt,
    spec_note: optionalText,

    category_id: optionalText,
    tags: z.array(z.string().trim().min(1)).default([]),
    featured: z.boolean(),

    images: z.array(productImageSchema).default([]),
    variants: z.array(productVariantSchema).default([]),
  })
  .refine(
    (product) =>
      product.compare_at_cents === null || product.compare_at_cents > product.price_cents,
    {
      path: ["compare_at_cents"],
      message: "The old price has to be higher than the price you are selling at.",
    },
  )
  .refine((product) => product.status !== "active" || product.images.length > 0, {
    path: ["images"],
    message: "Add at least one photo before putting it on the shelf.",
  });

export type ProductInput = z.infer<typeof productSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;

export const categorySchema = z.object({
  id: optionalText,
  name: z.string().trim().min(1, "Give the category a name.").max(60),
  slug: slugSchema,
  position: z.number().int().min(0).default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const settingsSchema = z.object({
  whatsapp_number: optionalText,
  announcement: optionalText,
  shop_open: z.boolean(),
  boxnow_origin_location_id: optionalText,
});

export type SettingsInput = z.infer<typeof settingsSchema>;

/**
 * Greek to Latin, because the shop is in Cyprus and a Greek title would
 * otherwise slugify to an empty string and be impossible to save.
 */
const GREEK_TO_LATIN: Record<string, string> = {
  α: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
};

function transliterate(value: string): string {
  return value.replace(/[Ͱ-Ͽἀ-῿]/g, (char) => GREEK_TO_LATIN[char] ?? "");
}

/** Title to slug. Same rules as slugSchema so the generated value always passes. */
export function slugify(title: string): string {
  return transliterate(title.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

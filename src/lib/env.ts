import { z } from "zod";

/**
 * Parsed once at module load, so a missing variable fails the boot with a
 * sentence rather than a 500 an hour later. Required means the site cannot
 * work without it. Optional means a feature degrades: no RESEND_API_KEY means
 * emails are skipped and logged, no BOX NOW vars means the provider reports
 * not-configured, and the app still builds and runs.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url({ message: "NEXT_PUBLIC_SITE_URL must be the full origin, like https://example.com" }),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "NEXT_PUBLIC_SUPABASE_URL is missing or not a URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, { message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  OWNER_EMAIL: z.string().email().optional().or(z.literal("")),
  NEXT_PUBLIC_BOXNOW_PARTNER_ID: z.string().optional(),
  BOXNOW_API_URL: z.string().optional(),
  BOXNOW_CLIENT_ID: z.string().optional(),
  BOXNOW_CLIENT_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${String(i.path[0])}: ${i.message}`).join("\n");
  throw new Error(`Environment is not set up. Copy .env.example to .env.local and fill these in:\n${lines}`);
}

export const env = parsed.data;

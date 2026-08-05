/**
 * Public Supabase config.
 *
 * These must stay as literal `process.env.NEXT_PUBLIC_*` references. Next inlines
 * them into the client bundle at build time by matching the text, so rewriting
 * them as a dynamic `process.env[name]` lookup would leave them undefined in the
 * browser.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in from the Supabase dashboard, Settings > API.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required(url, "NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return required(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

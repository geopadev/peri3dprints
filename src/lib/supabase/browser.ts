import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Client for Client Components. Respects RLS.
 *
 * Session storage is cookies, handled by @supabase/ssr, which is what lets the
 * server read the same session. Nothing about identity belongs in localStorage.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}

import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseUrl } from "./config";

/**
 * Service role client. Bypasses RLS completely.
 *
 * The `server-only` import above is the guard: importing this file from a Client
 * Component is a build error, not a runtime surprise. Never remove it.
 *
 * Use this only where RLS genuinely cannot express the rule, mainly creating
 * orders after recomputing every total from the database. Never to work around a
 * policy that is simply wrong. Fix the policy instead.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. It is server only and must never be exposed to the browser.",
    );
  }

  return createSupabaseClient<Database>(supabaseUrl(), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

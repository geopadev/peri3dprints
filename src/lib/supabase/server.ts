import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Cookie backed client for Server Components, Server Actions and Route Handlers.
 * Respects RLS, so it only ever sees what the signed in user is allowed to see.
 *
 * Async because `cookies()` is async in Next 15.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. That is fine: the middleware
          // refreshes the session on every request, so the write here is only
          // ever needed from Actions and Route Handlers, where it does work.
        }
      },
    },
  });
}

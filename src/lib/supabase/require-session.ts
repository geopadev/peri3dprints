import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";

/**
 * The guard for /account, /orders and /messages: any signed in buyer, not just
 * the owner. Middleware already redirects here, but middleware is a
 * convenience, not the security boundary, so every page calls this too.
 */
export async function requireSession(next: string): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);

  return user;
}

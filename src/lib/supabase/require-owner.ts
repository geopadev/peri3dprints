import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";

/**
 * The guard every admin page and every admin Server Action goes through.
 *
 * The middleware already redirects non-owners away from /admin, but middleware
 * is a convenience, not the security boundary. Anything that reads or writes
 * shop data calls this too, so a route that is ever excluded from the matcher
 * does not quietly become open.
 */
export async function requireOwner(): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // An anonymous buyer session is a signed in user but is not a login.
  if (!user || user.is_anonymous) redirect("/admin/login");

  const { data: isOwner, error } = await supabase.rpc("is_owner");
  if (error || !isOwner) redirect("/admin/not-owner");

  return user;
}

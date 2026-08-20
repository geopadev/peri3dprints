"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { codeForPostgresError } from "./messages";

/**
 * Changing a role goes through set_user_role, never through an update on
 * profiles. The column grant refuses a direct write to `role` anyway, so this
 * is not the only line of defence, but it keeps the rules about who may do it,
 * and the audit trail, in one place in the database.
 */
export async function changeRole(formData: FormData): Promise<void> {
  await requireOwner("/admin/people");

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || (role !== "customer" && role !== "owner")) {
    redirect("/admin/people?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    redirect(`/admin/people?error=${codeForPostgresError(error.code)}`);
  }

  revalidatePath("/admin/people");
  redirect("/admin/people");
}

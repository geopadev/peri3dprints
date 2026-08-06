"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { settingsSchema } from "@/lib/validation/product";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Check what you typed and try again.",
  failed: "Could not save that. Try again in a moment.",
};

export function settingsErrorMessage(code: string | undefined): string | null {
  return code ? (ERROR_MESSAGES[code] ?? ERROR_MESSAGES.failed ?? null) : null;
}

export async function saveSettings(formData: FormData): Promise<void> {
  await requireOwner();

  const parsed = settingsSchema.safeParse({
    whatsapp_number: String(formData.get("whatsapp_number") ?? ""),
    announcement: String(formData.get("announcement") ?? ""),
    // An unchecked checkbox sends nothing at all.
    shop_open: formData.get("shop_open") === "on",
    boxnow_origin_location_id: String(formData.get("boxnow_origin_location_id") ?? ""),
  });

  if (!parsed.success) redirect("/admin/settings?error=invalid");

  const supabase = await createClient();

  // The settings row is fixed at id = 1 by a check constraint.
  const { error } = await supabase
    .from("settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) redirect("/admin/settings?error=failed");

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

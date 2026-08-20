"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";

/** The owner's replies. Every one of these is owner only, twice: this guard,
 *  and RLS underneath it. */

export async function replyToConversation(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/messages");

  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!conversationId) redirect("/admin/messages");
  if (!body) redirect(`/admin/messages/${conversationId}?error=empty`);

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: "owner",
    kind: "text",
    body,
  });

  if (error) redirect(`/admin/messages/${conversationId}?error=failed`);

  await supabase.from("conversations").update({ unread_for_owner: false }).eq("id", conversationId);

  revalidatePath(`/admin/messages/${conversationId}`);
  revalidatePath("/admin/messages");
  redirect(`/admin/messages/${conversationId}`);
}

/**
 * Stage 9b's job, rendered by stage 11. The amount is taken in euros because
 * that is what he is looking at on his phone, and converted to cents here:
 * money is integer cents everywhere behind this line.
 */
export async function sendPaymentLink(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/messages");

  const conversationId = String(formData.get("conversationId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const euros = String(formData.get("amount") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!conversationId) redirect("/admin/messages");

  if (!/^https?:\/\/\S+$/.test(url)) {
    redirect(`/admin/messages/${conversationId}?error=link`);
  }

  const amountCents = Math.round(Number(euros.replace(",", ".")) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    redirect(`/admin/messages/${conversationId}?error=amount`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: "owner",
    kind: "payment_link",
    body: null,
    payload: { kind: "payment_link", url, amountCents, note: note || null },
  });

  if (error) redirect(`/admin/messages/${conversationId}?error=failed`);

  revalidatePath(`/admin/messages/${conversationId}`);
  redirect(`/admin/messages/${conversationId}`);
}

export async function closeConversation(formData: FormData): Promise<void> {
  await requireOwner("/admin/messages");
  const conversationId = String(formData.get("conversationId") ?? "");
  if (!conversationId) redirect("/admin/messages");

  const supabase = await createClient();
  await supabase.from("conversations").update({ status: "closed" }).eq("id", conversationId);

  revalidatePath("/admin/messages");
  redirect("/admin/messages");
}

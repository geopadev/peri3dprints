"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendMessageSchema, startConversationSchema } from "@/lib/validation/chat";

/**
 * The buyer's side of chat. Both of these refuse to do anything without a
 * session: CLAUDE.md section 6 says no conversation can exist without a signed
 * in buyer, and RLS enforces the same thing underneath.
 */

async function requireBuyer(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export async function startConversation(formData: FormData): Promise<void> {
  const { supabase, user } = await requireBuyer("/messages");

  const parsed = startConversationSchema.safeParse({
    body: String(formData.get("body") ?? ""),
    productId: (formData.get("productId") as string | null) || null,
    subject: (formData.get("subject") as string | null) || null,
  });

  if (!parsed.success) redirect("/messages?error=empty");

  const { body, productId, subject } = parsed.data;

  // Display name and email come from the account, so the starter form never
  // asks for them again.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: conversation, error: convoError } = await supabase
    .from("conversations")
    .insert({
      buyer_id: user.id,
      kind: productId ? "product" : "general",
      product_id: productId,
      subject,
      display_name: profile?.display_name ?? null,
      email: profile?.email ?? user.email ?? null,
    })
    .select("id")
    .single();

  if (convoError || !conversation) redirect("/messages?error=failed");

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_role: "buyer",
    kind: "text",
    body,
  });

  if (messageError) redirect("/messages?error=failed");

  revalidatePath("/messages");
  redirect("/messages");
}

export async function sendMessage(formData: FormData): Promise<void> {
  const { supabase, user } = await requireBuyer("/messages");

  const rawAttachments = String(formData.get("attachments") ?? "");
  let attachments: unknown = [];
  if (rawAttachments) {
    try {
      attachments = JSON.parse(rawAttachments);
    } catch {
      redirect("/messages?error=failed");
    }
  }

  const parsed = sendMessageSchema.safeParse({
    conversationId: String(formData.get("conversationId") ?? ""),
    body: String(formData.get("body") ?? ""),
    attachments,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    redirect(`/messages?error=${issue?.path[0] === "body" ? "empty" : "failed"}`);
  }

  const { conversationId, body, attachments: files } = parsed.data;

  // RLS would refuse a conversation that is not theirs, but checking here means
  // the person gets a sentence rather than a silent no-op.
  const { data: owned } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!owned) redirect("/messages?error=notyours");

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: "buyer",
    kind: "text",
    body: body || null,
    attachments: files,
  });

  if (error) redirect("/messages?error=failed");

  revalidatePath("/messages");
  redirect("/messages");
}

/** Clears the buyer's unread flag when they open the thread. */
export async function markRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("conversations")
    .update({ unread_for_buyer: false })
    .eq("id", conversationId)
    .eq("buyer_id", user.id);
}

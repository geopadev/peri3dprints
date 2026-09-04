"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { siteOrigin } from "@/lib/site-origin";

/** The owner's replies. Every one of these is owner only, twice: this guard,
 *  and RLS underneath it. */

export async function replyToConversation(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/messages");

  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  let attachments: unknown[] = [];
  try {
    const raw = JSON.parse(String(formData.get("attachments") ?? "[]"));
    if (Array.isArray(raw)) attachments = raw;
  } catch {
    attachments = [];
  }

  if (!conversationId) redirect("/admin/messages");
  if (!body && attachments.length === 0) redirect(`/admin/messages/${conversationId}?error=empty`);

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: "owner",
    kind: "text",
    body: body || null,
    attachments: attachments as never,
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

/**
 * Turns a custom request into something that can be bought: a one off product
 * tagged 'quote' so it never appears in the catalogue, and a message with the
 * link and price. The buyer adds it to the cart and asks to buy like anything
 * else, so there is still exactly one path that writes an order.
 */
export async function sendQuote(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/messages");
  const conversationId = String(formData.get("conversationId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const euros = String(formData.get("amount") ?? "").trim();
  if (!conversationId) redirect("/admin/messages");
  const priceCents = Math.round(Number(euros.replace(",", ".")) * 100);
  if (!title || !Number.isFinite(priceCents) || priceCents <= 0)
    redirect(`/admin/messages/${conversationId}?error=amount`);

  const supabase = await createClient();
  const slug = `quote-${Date.now().toString(36)}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)}`;
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      title,
      description,
      price_cents: priceCents,
      status: "active",
      made_to_order: true,
      tags: ["quote"],
    })
    .select("slug")
    .single();
  if (error || !product) redirect(`/admin/messages/${conversationId}?error=failed`);

  const site = await siteOrigin();
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: "owner",
    kind: "text",
    body: `Here is your quote: ${title} for ${(priceCents / 100).toFixed(2)} euros. ${description ? description + " " : ""}Add it to your cart here and ask to buy when you are ready: ${site}/product/${product.slug}`,
  });
  revalidatePath(`/admin/messages/${conversationId}`);
  redirect(`/admin/messages/${conversationId}`);
}

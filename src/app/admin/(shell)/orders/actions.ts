"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { sendOrderShipped } from "@/lib/email";
import { trackingUrlFor } from "@/lib/shipping/manual";
import { STATUS_STEPS } from "@/lib/orders";
import type { Database, Json } from "@/lib/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type Carrier = Database["public"]["Enums"]["carrier"];

/**
 * Every write to an order is owner only, twice: requireOwner here, and the
 * orders_update_owner policy underneath. Each one also writes an order_events
 * row, which is the audit trail.
 */
async function event(orderId: string, type: string, payload: Json) {
  const supabase = await createClient();
  await supabase.from("order_events").insert({ order_id: orderId, type, payload });
}

const back = (id: string, error?: string) =>
  redirect(`/admin/orders/${id}${error ? `?error=${error}` : ""}`);

/** Money is never inferred. He presses this because he saw it arrive. */
export async function markPaid(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/orders");
  const id = String(formData.get("orderId") ?? "");
  if (!id) redirect("/admin/orders");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "paid", status: "paid" })
    .eq("id", id);
  if (error) return back(id, "failed");

  await event(id, "paid", { by: user.id, at: new Date().toISOString() });
  revalidatePath(`/admin/orders/${id}`);
  return back(id);
}

export async function markRefunded(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/orders");
  const id = String(formData.get("orderId") ?? "");
  if (!id) redirect("/admin/orders");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "refunded", status: "refunded" })
    .eq("id", id);
  if (error) return back(id, "failed");

  await event(id, "refunded", { by: user.id, at: new Date().toISOString() });
  revalidatePath(`/admin/orders/${id}`);
  return back(id);
}

export async function setStatus(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/orders");
  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!id) redirect("/admin/orders");
  if (!(STATUS_STEPS as readonly string[]).includes(status)) return back(id, "status");

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("order_number, email, full_name, access_token, tracking_number, tracking_url")
    .single();
  if (error || !order) return back(id, "failed");

  await event(id, "status", { to: status, by: user.id, at: new Date().toISOString() });

  if (status === "shipped") {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await sendOrderShipped({
      to: order.email,
      name: order.full_name,
      orderNumber: order.order_number,
      orderUrl: `${site}/order/${order.order_number}?t=${order.access_token}`,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
    });
  }

  revalidatePath(`/admin/orders/${id}`);
  return back(id);
}

export async function saveTracking(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/orders");
  const id = String(formData.get("orderId") ?? "");
  const tracking = String(formData.get("tracking") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "") as Carrier;
  if (!id) redirect("/admin/orders");
  if (!tracking) return back(id, "tracking");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      tracking_number: tracking,
      tracking_url: trackingUrlFor(carrier, tracking),
      carrier_reference: carrier,
    })
    .eq("id", id);
  if (error) return back(id, "failed");

  await event(id, "tracking", { tracking, carrier, by: user.id });
  revalidatePath(`/admin/orders/${id}`);
  return back(id);
}

export async function saveOwnerNote(formData: FormData): Promise<void> {
  await requireOwner("/admin/orders");
  const id = String(formData.get("orderId") ?? "");
  if (!id) redirect("/admin/orders");
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ owner_note: String(formData.get("note") ?? "").trim() || null })
    .eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
  return back(id);
}

/** Posts the link into the order's conversation as a payment_link card. */
export async function sendOrderPaymentLink(formData: FormData): Promise<void> {
  const user = await requireOwner("/admin/orders");
  const id = String(formData.get("orderId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const euros = String(formData.get("amount") ?? "").trim();
  if (!id) redirect("/admin/orders");
  if (!/^https:\/\/\S+$/.test(url)) return back(id, "link");
  const amountCents = Math.round(Number(euros.replace(",", ".")) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return back(id, "amount");

  const supabase = await createClient();
  const { data: convo } = await supabase
    .from("conversations")
    .select("id")
    .eq("order_id", id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!convo) return back(id, "noconvo");

  const { error } = await supabase.from("messages").insert({
    conversation_id: convo.id,
    sender_id: user.id,
    sender_role: "owner",
    kind: "payment_link",
    body: null,
    payload: {
      kind: "payment_link",
      url,
      amountCents,
      note: `Order ${String(formData.get("orderNumber") ?? "")}`,
    },
  });
  if (error) return back(id, "failed");

  await supabase
    .from("orders")
    .update({ status: "awaiting_payment" })
    .eq("id", id)
    .eq("status", "pending");
  await event(id, "payment_link_sent", { amountCents, by: user.id });
  revalidatePath(`/admin/orders/${id}`);
  return back(id);
}

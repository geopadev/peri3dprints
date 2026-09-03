"use server";

import { createClient } from "@/lib/supabase/server";
import { askToBuySchema } from "@/lib/validation/order";
import { sendOwnerNewOrder, sendOrderConfirmed } from "@/lib/email";

export type PlaceOrderState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "done"; orderNumber: string; token: string };

/**
 * The only path that writes an order. It calls the create_order RPC, which
 * recomputes every price, the shipping cost and the zone from the database,
 * so nothing the browser sends about money is trusted.
 *
 * Delivery starts as collect at a market. Whether it is posted instead is
 * settled in the conversation, through the delivery details form.
 */
export async function placeOrder(
  _prev: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Sign in first and your cart will still be here." };

  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", message: "Your cart could not be read. Reload and try again." };
  }

  const parsed = askToBuySchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note") ?? "",
    items,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Check the details and try again.", fieldErrors };
  }

  const input = parsed.data;

  const { data: pickup } = await supabase
    .from("shipping_methods")
    .select("id")
    .eq("code", "pickup-festival")
    .maybeSingle();
  if (!pickup)
    return { status: "error", message: "Collection is not set up yet. Message me instead." };

  const { data: created, error } = await supabase.rpc("create_order", {
    p_email: input.email,
    p_phone: input.phone,
    p_full_name: input.fullName,
    p_payment_method: "link",
    p_shipping_method_id: pickup.id,
    p_country_code: "CY",
    p_shipping_address: null,
    p_pickup_point: null,
    p_items: input.items.map((line) => ({
      product_id: line.productId,
      variant_id: line.variantId,
      quantity: line.quantity,
    })),
    p_buyer_note: input.note ?? undefined,
  });

  const order = Array.isArray(created) ? created[0] : null;
  if (error || !order) {
    return { status: "error", message: error?.message ?? "That did not go through. Try again." };
  }

  // The conversation is where payment and delivery happen, so it opens now.
  const { data: convo } = await supabase
    .from("conversations")
    .insert({
      buyer_id: user.id,
      kind: "order",
      order_id: order.order_id,
      subject: `Order ${order.order_number}`,
      display_name: input.fullName,
      email: input.email,
    })
    .select("id")
    .single();

  if (convo) {
    const { data: titles } = await supabase
      .from("order_items")
      .select("title_snapshot, variant_snapshot, quantity")
      .eq("order_id", order.order_id);
    const what = (titles ?? [])
      .map(
        (t) =>
          `${t.quantity} x ${t.title_snapshot}${t.variant_snapshot ? ` (${t.variant_snapshot})` : ""}`,
      )
      .join(", ");
    await supabase.from("messages").insert({
      conversation_id: convo.id,
      sender_id: user.id,
      sender_role: "buyer",
      kind: "text",
      body: `I would like to buy ${what}.${input.note ? ` ${input.note}` : ""}`,
    });
  }

  // Best effort: a failed email must never fail the order.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const orderUrl = `${siteUrl}/order/${order.order_number}?t=${order.access_token}`;
  await Promise.allSettled([
    sendOrderConfirmed({
      to: input.email,
      name: input.fullName,
      orderNumber: order.order_number,
      orderUrl,
      totalCents: order.total_cents,
    }),
    sendOwnerNewOrder({
      orderNumber: order.order_number,
      name: input.fullName,
      totalCents: order.total_cents,
      adminUrl: `${siteUrl}/admin/orders/${order.order_id}`,
    }),
  ]);

  return { status: "done", orderNumber: order.order_number, token: order.access_token };
}

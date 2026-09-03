"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quoteShipping } from "@/lib/shipping";
import { deliveryDetailsSchema } from "@/lib/validation/chat";
import type { Database } from "@/lib/database.types";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type DeliveryState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "done" };

/**
 * The buyer fills this in from inside the conversation. The shipping cost is
 * re-quoted here through the shipping layer for the country given, from the
 * order's own items and weights in the database. Nothing about money arrives
 * from the form: a cost from the browser is a price the browser chose.
 */
export async function saveDeliveryDetails(
  _prev: DeliveryState,
  formData: FormData,
): Promise<DeliveryState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Sign in first." };

  const parsed = deliveryDetailsSchema.safeParse({
    orderId: formData.get("orderId"),
    method: formData.get("method"),
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
    line1: formData.get("line1") ?? "",
    line2: formData.get("line2") ?? "",
    city: formData.get("city") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    countryCode: formData.get("countryCode") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "");
      if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { status: "error", message: "Check the details and try again.", fieldErrors };
  }
  const d = parsed.data;
  const conversationId = String(formData.get("conversationId") ?? "");

  // RLS only returns the buyer's own order, and the update policy only allows
  // it while still unpaid.
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, subtotal_cents, order_items(quantity, products(weight_grams))")
    .eq("id", d.orderId)
    .maybeSingle();
  if (!order) return { status: "error", message: "That order could not be found." };
  if (!["pending", "awaiting_payment"].includes(order.status)) {
    return {
      status: "error",
      message:
        "That order is already on its way, so the address cannot change. Message me instead.",
    };
  }

  let update: OrderUpdate;
  if (d.method === "collect") {
    const { data: pickup } = await supabase
      .from("shipping_methods")
      .select("id")
      .eq("code", "pickup-festival")
      .maybeSingle();
    update = {
      shipping_method_id: pickup?.id ?? null,
      shipping_cents: 0,
      total_cents: order.subtotal_cents,
      shipping_address: null,
    };
  } else {
    const totalWeightGrams = (order.order_items ?? []).reduce(
      (sum, item) => sum + item.quantity * (item.products?.weight_grams ?? 0),
      0,
    );
    const { quotes } = await quoteShipping(
      { subtotalCents: order.subtotal_cents, totalWeightGrams },
      d.countryCode,
    );
    const usable = quotes.filter((q) => !q.method.requiresLocker && q.method.carrier !== "pickup");
    const cheapest = usable.sort((a, b) => a.priceCents - b.priceCents)[0];
    if (!cheapest)
      return {
        status: "error",
        message: "I cannot post to that country yet. Message me and we will work something out.",
      };
    update = {
      shipping_method_id: cheapest.method.id,
      shipping_cents: cheapest.priceCents,
      total_cents: order.subtotal_cents + cheapest.priceCents,
      shipping_address: {
        fullName: d.fullName,
        phone: d.phone,
        line1: d.line1,
        line2: d.line2,
        city: d.city,
        postalCode: d.postalCode,
        countryCode: d.countryCode,
      },
    };
  }

  const { error } = await supabase.from("orders").update(update).eq("id", d.orderId);
  if (error) return { status: "error", message: "That did not save. Try again in a moment." };

  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: "buyer",
      kind: "delivery_details",
      body: null,
      payload:
        d.method === "collect"
          ? { kind: "delivery_details", method: "collect" }
          : {
              kind: "delivery_details",
              method: "post",
              fullName: d.fullName,
              phone: d.phone,
              line1: d.line1,
              line2: d.line2,
              city: d.city,
              postalCode: d.postalCode,
              countryCode: d.countryCode,
            },
    });
    revalidatePath(`/messages/${conversationId}`);
  }
  return { status: "done" };
}

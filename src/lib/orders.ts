import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: Record<string, unknown> | null;
  pickupPoint: Record<string, unknown> | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  buyerNote: string | null;
  createdAt: string;
  method: { code: string; label: string; carrier: string } | null;
  items: {
    id: string;
    title: string;
    variant: string | null;
    image: string | null;
    unitCents: number;
    quantity: number;
  }[];
  events: { type: string; at: string; payload: unknown }[];
  conversationId: string | null;
};

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown) => (typeof v === "string" ? v : null);
const obj = (v: unknown) =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** The jsonb from get_order_by_token, read defensively. */
export function toOrderView(raw: unknown): OrderView | null {
  const r = obj(raw);
  if (!r || typeof r.orderNumber !== "string") return null;
  const method = obj(r.method);
  return {
    id: str(r.id),
    orderNumber: r.orderNumber,
    status: str(r.status),
    paymentMethod: str(r.paymentMethod),
    paymentStatus: str(r.paymentStatus),
    fullName: str(r.fullName),
    email: str(r.email),
    phone: str(r.phone),
    shippingAddress: obj(r.shippingAddress),
    pickupPoint: obj(r.pickupPoint),
    subtotalCents: num(r.subtotalCents),
    shippingCents: num(r.shippingCents),
    totalCents: num(r.totalCents),
    trackingNumber: strOrNull(r.trackingNumber),
    trackingUrl: strOrNull(r.trackingUrl),
    buyerNote: strOrNull(r.buyerNote),
    createdAt: str(r.createdAt),
    method: method
      ? { code: str(method.code), label: str(method.label), carrier: str(method.carrier) }
      : null,
    items: (Array.isArray(r.items) ? r.items : []).flatMap((i) => {
      const o = obj(i);
      return o
        ? [
            {
              id: str(o.id),
              title: str(o.title),
              variant: strOrNull(o.variant),
              image: strOrNull(o.image),
              unitCents: num(o.unitCents),
              quantity: num(o.quantity),
            },
          ]
        : [];
    }),
    events: (Array.isArray(r.events) ? r.events : []).flatMap((e) => {
      const o = obj(e);
      return o ? [{ type: str(o.type), at: str(o.at), payload: o.payload }] : [];
    }),
    conversationId: strOrNull(r.conversationId),
  };
}

/** Token access, no session needed. A wrong token returns null, never an error. */
export async function getOrderByToken(
  orderNumber: string,
  token: string,
): Promise<OrderView | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_order_by_token", {
    p_order_number: orderNumber,
    p_token: token,
  });
  return toOrderView(data);
}

export const STATUS_STEPS = [
  "pending",
  "paid",
  "printing",
  "ready",
  "shipped",
  "delivered",
] as const;

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Waiting for payment",
    awaiting_payment: "Waiting for payment",
    paid: "Paid",
    printing: "Printing",
    ready: "Ready",
    shipped: "Posted",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return labels[status] ?? status;
}

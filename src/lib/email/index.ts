import "server-only";
import { sendEmail } from "./send";
import {
  OrderConfirmedEmail,
  OrderUpdateEmail,
  OwnerNewMessageEmail,
  OwnerNewOrderEmail,
} from "./templates";

const ownerEmail = () => process.env.OWNER_EMAIL ?? "";

export async function sendOrderConfirmed(p: {
  to: string;
  name: string;
  orderNumber: string;
  orderUrl: string;
  totalCents: number;
}) {
  return sendEmail({
    to: p.to,
    subject: `Order ${p.orderNumber} received`,
    react: OrderConfirmedEmail(p),
  });
}

/** Sent on every status change the owner makes, with whatever note they wrote. */
export async function sendOrderUpdate(p: {
  to: string;
  name: string;
  orderNumber: string;
  orderUrl: string;
  statusLabel: string;
  note: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}) {
  return sendEmail({
    to: p.to,
    subject: `Order ${p.orderNumber}: ${p.statusLabel}`,
    react: OrderUpdateEmail(p),
  });
}

export async function sendOwnerNewOrder(p: {
  orderNumber: string;
  name: string;
  totalCents: number;
  adminUrl: string;
}) {
  const to = ownerEmail();
  if (!to) return { ok: false, skipped: true as const };
  return sendEmail({ to, subject: `New order ${p.orderNumber}`, react: OwnerNewOrderEmail(p) });
}

export async function sendOwnerNewMessage(p: { from: string; preview: string; adminUrl: string }) {
  const to = ownerEmail();
  if (!to) return { ok: false, skipped: true as const };
  return sendEmail({ to, subject: `New message from ${p.from}`, react: OwnerNewMessageEmail(p) });
}

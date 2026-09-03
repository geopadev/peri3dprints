import "server-only";
import { sendEmail } from "./send";
import {
  OrderConfirmedEmail,
  OrderShippedEmail,
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

export async function sendOrderShipped(p: {
  to: string;
  name: string;
  orderNumber: string;
  orderUrl: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}) {
  return sendEmail({
    to: p.to,
    subject: `Order ${p.orderNumber} is on its way`,
    react: OrderShippedEmail(p),
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

import "server-only";
import { createClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  kind: "message" | "order";
  title: string;
  detail: string | null;
  href: string;
  at: string | null;
};

export type Notifications = {
  items: NotificationItem[];
  /** Unread messages only, for the badge on anything labelled Messages. */
  messageCount: number;
  total: number;
};

const EMPTY: Notifications = { items: [], messageCount: 0, total: 0 };

/**
 * What is waiting for whoever is signed in, as one list.
 *
 * The owner gets the shop's version, the buyer gets their own, decided by
 * is_owner() rather than by which page asked. Someone who owns the shop is
 * using it as the shop; their own buying history is not what a bell in the
 * admin should be counting.
 *
 * Every query here is RLS scoped already, so none of them re-check who is
 * asking: a buyer running the owner's query would simply see their own row.
 */
export async function getNotifications(): Promise<Notifications> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: isOwner } = await supabase.rpc("is_owner");

  return isOwner ? ownerNotifications() : buyerNotifications(user.id);
}

async function ownerNotifications(): Promise<Notifications> {
  const supabase = await createClient();

  const [{ data: conversations }, { data: orders }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, subject, display_name, email, last_message_at")
      .eq("unread_for_owner", true)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from("orders")
      .select("id, order_number, full_name, total_cents, created_at")
      .eq("unread_for_owner", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const messages: NotificationItem[] = (conversations ?? []).map((c) => ({
    id: `message-${c.id}`,
    kind: "message",
    title: c.display_name ?? c.email ?? "Someone",
    detail: c.subject ?? "New message",
    href: `/admin/messages/${c.id}`,
    at: c.last_message_at,
  }));

  const newOrders: NotificationItem[] = (orders ?? []).map((o) => ({
    id: `order-${o.id}`,
    kind: "order",
    title: `New order ${o.order_number}`,
    detail: o.full_name,
    href: `/admin/orders/${o.id}`,
    at: o.created_at,
  }));

  return assemble(messages, newOrders);
}

async function buyerNotifications(userId: string): Promise<Notifications> {
  const supabase = await createClient();

  const [{ data: conversations }, { data: orders }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, subject, last_message_at")
      .eq("buyer_id", userId)
      .eq("unread_for_buyer", true)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from("orders")
      .select("order_number, access_token, status, created_at")
      .eq("buyer_id", userId)
      .eq("unread_for_buyer", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const messages: NotificationItem[] = (conversations ?? []).map((c) => ({
    id: `message-${c.id}`,
    kind: "message",
    title: "Peri replied",
    detail: c.subject ?? "New message",
    href: `/messages/${c.id}`,
    at: c.last_message_at,
  }));

  const updates: NotificationItem[] = (orders ?? []).map((o) => ({
    id: `order-${o.order_number}`,
    kind: "order",
    title: `Order ${o.order_number}`,
    detail: "There is an update on your order",
    // The tokenised link, the same one the email uses, so this works whether
    // or not the session is still around by the time it is clicked.
    href: `/order/${o.order_number}?t=${o.access_token}`,
    at: o.created_at,
  }));

  return assemble(messages, updates);
}

function assemble(messages: NotificationItem[], others: NotificationItem[]): Notifications {
  const items = [...messages, ...others].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return { items, messageCount: messages.length, total: items.length };
}

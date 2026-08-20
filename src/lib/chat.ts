import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Attachment } from "@/lib/validation/chat";

export type MessageKind = "text" | "payment_link" | "delivery_details";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: "buyer" | "owner";
  body: string | null;
  kind: MessageKind;
  payload: PaymentLinkPayload | DeliveryDetailsPayload | null;
  attachments: Attachment[];
  createdAt: string;
};

export type PaymentLinkPayload = {
  kind: "payment_link";
  url: string;
  amountCents: number;
  note: string | null;
};

export type DeliveryDetailsPayload = {
  kind: "delivery_details";
  method: "post" | "collect";
  fullName: string | null;
  phone: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
};

export type Conversation = {
  id: string;
  subject: string | null;
  kind: "general" | "custom_request" | "product" | "order";
  status: "open" | "awaiting_owner" | "awaiting_buyer" | "closed";
  orderId: string | null;
  productId: string | null;
  displayName: string | null;
  email: string | null;
  lastMessageAt: string | null;
  unreadForOwner: boolean;
  unreadForBuyer: boolean;
};

/**
 * `payload` is jsonb, so it arrives as `unknown`. Everything written into it
 * goes through a zod schema on the way in, but a row could predate a shape
 * change, so read it defensively rather than casting and hoping.
 */
function readPayload(kind: MessageKind, raw: unknown): ChatMessage["payload"] {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  if (kind === "payment_link") {
    const url = typeof record.url === "string" ? record.url : null;
    const amountCents = typeof record.amountCents === "number" ? record.amountCents : null;
    if (!url || amountCents === null) return null;
    return {
      kind: "payment_link",
      url,
      amountCents,
      note: typeof record.note === "string" ? record.note : null,
    };
  }

  if (kind === "delivery_details") {
    const method = record.method === "collect" ? "collect" : "post";
    const text = (key: string) =>
      typeof record[key] === "string" ? (record[key] as string) : null;
    return {
      kind: "delivery_details",
      method,
      fullName: text("fullName"),
      phone: text("phone"),
      line1: text("line1"),
      line2: text("line2"),
      city: text("city"),
      postalCode: text("postalCode"),
      countryCode: text("countryCode"),
    };
  }

  return null;
}

function readAttachments(raw: unknown): Attachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.path !== "string" || typeof record.name !== "string") return [];
    return [
      {
        path: record.path,
        name: record.name,
        size: typeof record.size === "number" ? record.size : 0,
        type: typeof record.type === "string" ? record.type : "image/*",
      },
    ];
  });
}

function toKind(raw: string): MessageKind {
  return raw === "payment_link" || raw === "delivery_details" ? raw : "text";
}

/**
 * The buyer's own thread. One general conversation per buyer keeps the widget
 * simple: he is talking to one person, not opening tickets.
 */
export async function getMyConversation(): Promise<Conversation | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, subject, kind, status, order_id, product_id, display_name, email, last_message_at, unread_for_owner, unread_for_buyer",
    )
    .eq("buyer_id", user.id)
    .eq("kind", "general")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return data ? toConversation(data) : null;
}

type ConversationRow = {
  id: string;
  subject: string | null;
  kind: string;
  status: string;
  order_id: string | null;
  product_id: string | null;
  display_name: string | null;
  email: string | null;
  last_message_at: string | null;
  unread_for_owner: boolean | null;
  unread_for_buyer: boolean | null;
};

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    subject: row.subject,
    kind: row.kind as Conversation["kind"],
    status: row.status as Conversation["status"],
    orderId: row.order_id,
    productId: row.product_id,
    displayName: row.display_name,
    email: row.email,
    lastMessageAt: row.last_message_at,
    unreadForOwner: row.unread_for_owner ?? false,
    unreadForBuyer: row.unread_for_buyer ?? false,
  };
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_role, body, kind, payload, attachments, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const kind = toKind(row.kind);
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderRole: row.sender_role as "buyer" | "owner",
      body: row.body,
      kind,
      payload: readPayload(kind, row.payload),
      attachments: readAttachments(row.attachments),
      createdAt: row.created_at ?? new Date(0).toISOString(),
    };
  });
}

export type InboxEntry = Conversation & {
  preview: string | null;
};

/**
 * The owner's inbox, unread first then most recent. RLS already restricts this
 * to the owner, so there is no role check here: a buyer running the same query
 * sees only their own row.
 */
export async function getInbox(): Promise<InboxEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, subject, kind, status, order_id, product_id, display_name, email, last_message_at, unread_for_owner, unread_for_buyer",
    )
    .order("unread_for_owner", { ascending: false })
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);

  const conversations = (data ?? []).map(toConversation);
  if (conversations.length === 0) return [];

  // One query for the previews rather than one per row.
  const { data: recent } = await supabase
    .from("messages")
    .select("conversation_id, body, kind, created_at")
    .in(
      "conversation_id",
      conversations.map((conversation) => conversation.id),
    )
    .order("created_at", { ascending: false });

  const previews = new Map<string, string>();
  for (const row of recent ?? []) {
    if (previews.has(row.conversation_id)) continue;
    previews.set(row.conversation_id, previewFor(toKind(row.kind), row.body));
  }

  return conversations.map((conversation) => ({
    ...conversation,
    preview: previews.get(conversation.id) ?? null,
  }));
}

function previewFor(kind: MessageKind, body: string | null): string {
  if (kind === "payment_link") return "Payment link sent";
  if (kind === "delivery_details") return "Delivery details filled in";
  const trimmed = body?.trim();
  if (!trimmed) return "Picture";
  return trimmed.length > 90 ? `${trimmed.slice(0, 90)}...` : trimmed;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, subject, kind, status, order_id, product_id, display_name, email, last_message_at, unread_for_owner, unread_for_buyer",
    )
    .eq("id", id)
    .maybeSingle();

  return data ? toConversation(data) : null;
}

/** Signed URLs, because chat-uploads is private and stays that way. */
export async function signAttachments(
  attachments: Attachment[],
): Promise<(Attachment & { url: string | null })[]> {
  if (attachments.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.storage.from("chat-uploads").createSignedUrls(
    attachments.map((attachment) => attachment.path),
    60 * 60,
  );

  const urls = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl]));
  return attachments.map((attachment) => ({
    ...attachment,
    url: urls.get(attachment.path) ?? null,
  }));
}

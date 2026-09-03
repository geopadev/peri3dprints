import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, Card, Notice, Textarea } from "@/components/ui";
import { getConversation, getMessages, signAttachments } from "@/lib/chat";
import { getSettings } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/whatsapp-link";
import { markRead, sendMessage } from "../actions";
import { chatErrorMessage } from "../messages";
import { LiveThread } from "../live-thread";
import { DeliveryDetailsButton } from "../delivery-details-dialog";
import { AttachmentPicker } from "../attachment-picker";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/messages/${id}`)}`);

  const { error } = await searchParams;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const [messages, settings] = await Promise.all([getMessages(id), getSettings()]);
  if (conversation.unreadForBuyer) await markRead(id);

  // Signed URLs for any pictures, since the bucket is private.
  const withUrls = await Promise.all(
    messages.map(async (m) => ({ ...m, attachments: await signAttachments(m.attachments) })),
  );

  // The delivery form only makes sense on an order that has no address yet.
  let needsDelivery = false;
  if (conversation.orderId) {
    const { data: order } = await supabase
      .from("orders")
      .select("shipping_address, status")
      .eq("id", conversation.orderId)
      .maybeSingle();
    needsDelivery = Boolean(
      order && !order.shipping_address && ["pending", "awaiting_payment"].includes(order.status),
    );
  }

  const whatsappHref = settings.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, `Hi, about ${conversation.subject ?? "my order"}.`)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">{conversation.subject ?? "Messages"}</h1>
          <p className="mt-1 text-sm">
            One person, not a bot. I answer most days, usually in the evening.
          </p>
        </div>
        <Link href="/messages" className="font-semibold underline">
          All messages
        </Link>
      </div>

      {chatErrorMessage(error) && (
        <Notice role="alert">
          <p>{chatErrorMessage(error)}</p>
        </Notice>
      )}

      <LiveThread conversationId={id} initial={withUrls} viewer="buyer" />

      {conversation.orderId && needsDelivery && (
        <DeliveryDetailsButton orderId={conversation.orderId} conversationId={id} />
      )}

      <Card className="flex flex-col gap-3">
        <form action={sendMessage} className="flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={id} />
          <label className="font-semibold" htmlFor="chat-body">
            Write a message
          </label>
          <Textarea id="chat-body" name="body" rows={3} placeholder="Ask me anything" />
          <AttachmentPicker conversationId={id} bucket="chat-uploads" />
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Send</Button>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">
                  WhatsApp instead
                </Button>
              </a>
            )}
          </div>
        </form>
      </Card>
    </main>
  );
}

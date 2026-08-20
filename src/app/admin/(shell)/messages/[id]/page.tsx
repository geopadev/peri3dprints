import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Input, Notice, Textarea } from "@/components/ui";
import { MessageList } from "@/app/(site)/messages/message-list";
import { getConversation, getMessages } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { closeConversation, replyToConversation, sendPaymentLink } from "../actions";
import { inboxErrorMessage } from "../messages";
import { CannedReplies } from "./canned-replies";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

const REPLY_BOX_ID = "owner-reply";

export default async function AdminConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner("/admin/messages");

  const { id } = await params;
  const { error } = await searchParams;
  const errorMessage = inboxErrorMessage(error);

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const messages = await getMessages(id);

  const supabase = await createClient();

  // Clearing this on open is why he can trust the New tag in the list.
  if (conversation.unreadForOwner) {
    await supabase.from("conversations").update({ unread_for_owner: false }).eq("id", id);
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("canned_replies")
    .eq("id", 1)
    .maybeSingle();

  const canned = Array.isArray(settings?.canned_replies)
    ? (settings.canned_replies as unknown[]).filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl">
            {conversation.displayName ?? conversation.email ?? "Someone"}
          </h1>
          {conversation.email && <p className="truncate text-sm">{conversation.email}</p>}
        </div>
        <Link href="/admin/messages" className="font-semibold underline">
          Back to messages
        </Link>
      </div>

      {errorMessage && (
        <Notice role="alert">
          <p>{errorMessage}</p>
        </Notice>
      )}

      <MessageList messages={messages} />

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Reply</h2>
        <CannedReplies replies={canned} targetId={REPLY_BOX_ID} />
        <form action={replyToConversation} className="flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={conversation.id} />
          <Textarea id={REPLY_BOX_ID} name="body" rows={3} placeholder="Write back" />
          <Button type="submit">Send</Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Ask for payment</h2>
        <p className="text-sm">
          Paste the link you want them to pay through, and how much it is for. They see it as a card
          in the conversation.
        </p>
        <form action={sendPaymentLink} className="flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={conversation.id} />
          <label className="font-semibold" htmlFor="pay-url">
            Payment link
          </label>
          <Input id="pay-url" name="url" type="url" placeholder="https://revolut.me/..." required />
          <label className="font-semibold" htmlFor="pay-amount">
            Amount in euros
          </label>
          <Input id="pay-amount" name="amount" inputMode="decimal" placeholder="18.00" required />
          <label className="font-semibold" htmlFor="pay-note">
            What it is for
          </label>
          <Input id="pay-note" name="note" placeholder="Axolotl in dark green" />
          <Button type="submit" variant="secondary">
            Send the payment link
          </Button>
        </form>
      </Card>

      {conversation.status !== "closed" && (
        <form action={closeConversation}>
          <input type="hidden" name="conversationId" value={conversation.id} />
          <Button type="submit" variant="ghost">
            Mark this finished
          </Button>
        </form>
      )}
    </main>
  );
}

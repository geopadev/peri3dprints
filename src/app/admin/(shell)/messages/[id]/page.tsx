import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Input, Notice, Textarea } from "@/components/ui";
import { LiveThread } from "@/app/(site)/messages/live-thread";
import { AttachmentPicker } from "@/app/(site)/messages/attachment-picker";
import { Money } from "@/components/ui";
import { getConversation, getMessages, signAttachments } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { closeConversation, replyToConversation, sendPaymentLink, sendQuote } from "../actions";
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
  const withUrls = await Promise.all(
    messages.map(async (m) => ({ ...m, attachments: await signAttachments(m.attachments) })),
  );

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

  const { data: details } =
    conversation.kind === "custom_request"
      ? await supabase
          .from("custom_request_details")
          .select("*")
          .eq("conversation_id", id)
          .maybeSingle()
      : { data: null };
  const referenceUrls = details?.reference_paths?.length
    ? await signAttachments(
        details.reference_paths.map((path) => ({
          path,
          name: path.split("/").pop() ?? path,
          size: 0,
          type: "image/*",
        })),
      )
    : [];

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

      {details && (
        <Card accent="offer" className="flex flex-col gap-2">
          <h2 className="text-xl">Custom request</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {details.budget_cents !== null && (
              <>
                <dt className="font-semibold">Budget</dt>
                <dd>
                  <Money cents={details.budget_cents} />
                </dd>
              </>
            )}
            {details.deadline && (
              <>
                <dt className="font-semibold">Needed by</dt>
                <dd>{details.deadline}</dd>
              </>
            )}
            {details.colour_pref && (
              <>
                <dt className="font-semibold">Colour</dt>
                <dd>{details.colour_pref}</dd>
              </>
            )}
            {details.size_note && (
              <>
                <dt className="font-semibold">Size</dt>
                <dd>{details.size_note}</dd>
              </>
            )}
          </dl>
          {referenceUrls.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {referenceUrls.map((f) =>
                f.url ? (
                  <li key={f.path}>
                    <a href={f.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt={f.name}
                        className="h-20 w-20 rounded-card border-2 border-ink object-cover"
                      />
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </Card>
      )}

      <LiveThread conversationId={id} initial={withUrls} viewer="owner" />

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Reply</h2>
        <CannedReplies replies={canned} targetId={REPLY_BOX_ID} />
        <form action={replyToConversation} className="flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={conversation.id} />
          <Textarea id={REPLY_BOX_ID} name="body" rows={3} placeholder="Write back" />
          <AttachmentPicker conversationId={id} bucket="chat-uploads" />
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

      {conversation.kind === "custom_request" && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl">Send a quote</h2>
          <p className="text-sm">
            Makes a one off print only they can buy, and posts the link into the thread.
          </p>
          <form action={sendQuote} className="flex flex-col gap-3">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <label className="font-semibold" htmlFor="quote-title">
              What it is
            </label>
            <Input
              id="quote-title"
              name="title"
              required
              placeholder="Cat phone stand, 10 cm, dark green"
            />
            <label className="font-semibold" htmlFor="quote-amount">
              Price in euros
            </label>
            <Input
              id="quote-amount"
              name="amount"
              inputMode="decimal"
              required
              placeholder="24.00"
            />
            <label className="font-semibold" htmlFor="quote-desc">
              Anything to add
            </label>
            <Textarea
              id="quote-desc"
              name="description"
              rows={2}
              placeholder="Ready in about 4 days."
            />
            <Button type="submit" variant="secondary">
              Send the quote
            </Button>
          </form>
        </Card>
      )}

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

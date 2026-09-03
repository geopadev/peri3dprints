import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card, EmptyState, Notice, Tag, Textarea } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import { getMyConversations } from "@/lib/chat";
import { getSettings } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/whatsapp-link";
import { startConversation } from "./actions";
import { chatErrorMessage } from "./messages";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // One of the two sign in walls in the whole site, per CLAUDE.md section 6.
  if (!user) redirect("/sign-in?next=%2Fmessages");

  const { error } = await searchParams;
  const errorMessage = chatErrorMessage(error);
  const [conversations, settings] = await Promise.all([getMyConversations(), getSettings()]);

  // One thread and nothing else to choose between: go straight into it.
  if (conversations.length === 1 && !error) redirect(`/messages/${conversations[0].id}`);

  const whatsappHref = settings.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, "Hi, I have a question about a print.")
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
      <div>
        <h1 className="text-2xl">Messages</h1>
        <p className="mt-2">
          This goes straight to me, not a bot. I answer most days, usually in the evening.
        </p>
      </div>

      {errorMessage && (
        <Notice role="alert">
          <p>{errorMessage}</p>
        </Notice>
      )}

      {conversations.length > 1 && (
        <ul className="flex flex-col gap-3">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className={cn("block", FOCUS_RING)}>
                <Card interactive className="flex items-center justify-between gap-3">
                  <span className="truncate font-semibold">{c.subject ?? "Chat with me"}</span>
                  <span className="flex shrink-0 gap-2">
                    {c.unreadForBuyer && <Tag tone="sale">New</Tag>}
                    {c.orderId && <Tag tone="info">Order</Tag>}
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {conversations.length === 0 ? (
        <Card className="flex flex-col gap-3">
          <form action={startConversation} className="flex flex-col gap-3">
            <label className="font-semibold" htmlFor="chat-start">
              What do you want to ask
            </label>
            <p className={`${UTILITY_TEXT} text-ink`}>I already have your name and email</p>
            <Textarea
              id="chat-start"
              name="body"
              rows={4}
              required
              placeholder="Can you print this in dark green?"
            />
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
      ) : (
        <EmptyState
          title="Want to ask something new"
          description="Start another conversation."
          action={
            <form
              action={startConversation}
              className="flex w-full max-w-md flex-col gap-3 text-left"
            >
              <Textarea name="body" rows={3} required placeholder="Ask me anything" />
              <Button type="submit">Send</Button>
            </form>
          }
        />
      )}
    </main>
  );
}

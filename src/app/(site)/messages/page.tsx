import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Card, Notice, Textarea } from "@/components/ui";
import { UTILITY_TEXT } from "@/components/ui/type";
import { getMessages, getMyConversation } from "@/lib/chat";
import { getSettings } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/whatsapp-link";
import { markRead, sendMessage, startConversation } from "./actions";
import { chatErrorMessage } from "./messages";
import { MessageList } from "./message-list";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

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

  const [conversation, settings] = await Promise.all([getMyConversation(), getSettings()]);
  const messages = conversation ? await getMessages(conversation.id) : [];

  if (conversation?.unreadForBuyer) {
    await markRead(conversation.id);
  }

  const whatsappHref = settings.whatsappNumber
    ? whatsappLink(settings.whatsappNumber, "Hi, I have a question about a print.")
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
      <div>
        <h1 className="text-2xl">Messages</h1>
        {/* The brief asks for this in as many words: it is one person, and
            roughly when he answers. */}
        <p className="mt-2">
          This goes straight to me, not a bot. I answer most days, usually in the evening.
        </p>
      </div>

      {errorMessage && (
        <Notice role="alert">
          <p>{errorMessage}</p>
        </Notice>
      )}

      {conversation ? (
        <>
          <MessageList messages={messages} />

          <Card className="flex flex-col gap-3">
            <form action={sendMessage} className="flex flex-col gap-3">
              <input type="hidden" name="conversationId" value={conversation.id} />
              <label className="font-semibold" htmlFor="chat-body">
                Write a message
              </label>
              <Textarea id="chat-body" name="body" rows={3} placeholder="Ask me anything" />
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
        </>
      ) : (
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
      )}
    </main>
  );
}

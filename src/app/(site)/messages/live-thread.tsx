"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { MessageList, type ThreadMessage } from "./message-list";

/**
 * The thread, kept live. The server renders the messages it has; this
 * subscribes to inserts on this one conversation and appends them, so the
 * other person's reply appears without a refresh.
 *
 * Filtered by conversation_id, and RLS applies to Realtime too, so a buyer's
 * socket is never handed another thread's rows.
 */
export function LiveThread({
  conversationId,
  initial,
  viewer,
}: {
  conversationId: string;
  initial: ThreadMessage[];
  viewer: "buyer" | "owner";
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initial);

  // A fresh server render (after sending) is the source of truth.
  useEffect(() => setMessages(initial), [initial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = String(row.id ?? "");
          setMessages((current) => {
            if (!id || current.some((m) => m.id === id)) return current;
            const kind =
              row.kind === "payment_link" || row.kind === "delivery_details" ? row.kind : "text";
            return [
              ...current,
              {
                id,
                conversationId,
                senderRole: row.sender_role === "owner" ? "owner" : "buyer",
                body: typeof row.body === "string" ? row.body : null,
                kind,
                payload: (row.payload as ThreadMessage["payload"]) ?? null,
                // Signed URLs need the server; pictures arriving live show on
                // the next render rather than as broken images now.
                attachments: [],
                createdAt:
                  typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (messages.length === 0) {
    return (
      <p className="text-sm">
        {viewer === "buyer" ? "Nothing here yet. Say hello." : "No messages in this thread yet."}
      </p>
    );
  }

  return <MessageList messages={messages} />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, Tag } from "@/components/ui";
import { UTILITY_TEXT } from "@/components/ui/type";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { getInbox } from "@/lib/chat";
import { whenAgo } from "./messages";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function AdminMessagesPage() {
  const inbox = await getInbox();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8">
      <h1 className="text-2xl">Messages</h1>

      {inbox.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="When someone asks about a print it lands here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {inbox.map((entry) => (
            <li key={entry.id}>
              <Link href={`/admin/messages/${entry.id}`} className={cn("block", FOCUS_RING)}>
                <Card interactive className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-semibold">
                      {entry.displayName ?? entry.email ?? "Someone"}
                    </p>
                    <span className={cn(UTILITY_TEXT, "shrink-0 text-ink")}>
                      {whenAgo(entry.lastMessageAt)}
                    </span>
                  </div>

                  {entry.preview && <p className="line-clamp-2 text-sm">{entry.preview}</p>}

                  <div className="flex flex-wrap gap-2">
                    {entry.unreadForOwner && <Tag tone="sale">New</Tag>}
                    {entry.status === "closed" && <Tag>Closed</Tag>}
                    {entry.orderId && <Tag tone="info">About an order</Tag>}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

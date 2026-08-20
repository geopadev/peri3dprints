import { Money, Tag } from "@/components/ui";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/chat";

function time(iso: string): string {
  return new Intl.DateTimeFormat("en-CY", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * One bubble per message. The owner's messages sit left and the buyer's right,
 * the way every messaging app on a phone already works, so nobody has to learn
 * which side means what.
 */
export function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) return null;

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => {
        const mine = message.senderRole === "buyer";

        return (
          <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-card border-2 border-ink p-3 sm:max-w-[70%]",
                mine ? "bg-surface" : "bg-info-wash",
              )}
            >
              {message.kind === "payment_link" && message.payload?.kind === "payment_link" ? (
                <PaymentLinkCard payload={message.payload} />
              ) : message.kind === "delivery_details" &&
                message.payload?.kind === "delivery_details" ? (
                <DeliveryCard payload={message.payload} />
              ) : (
                message.body && <p className="whitespace-pre-line">{message.body}</p>
              )}

              <p className={cn(UTILITY_TEXT, "mt-2 text-ink")}>{time(message.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Only the owner can send one of these. A buyer pasting a link is plain text,
 * enforced by a trigger in the database rather than by this component.
 */
function PaymentLinkCard({
  payload,
}: {
  payload: Extract<NonNullable<ChatMessage["payload"]>, { kind: "payment_link" }>;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Tag tone="sale">To pay</Tag>
      <p className="font-display text-xl font-extrabold">
        <Money cents={payload.amountCents} />
      </p>
      {payload.note && <p className="text-sm">{payload.note}</p>}
      <a
        href={payload.url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid"
      >
        Open the payment link
      </a>
    </div>
  );
}

function DeliveryCard({
  payload,
}: {
  payload: Extract<NonNullable<ChatMessage["payload"]>, { kind: "delivery_details" }>;
}) {
  if (payload.method === "collect") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Tag tone="info">Collecting</Tag>
        <p className="mt-1">Picking it up at a market, so nothing to post.</p>
      </div>
    );
  }

  const lines = [
    payload.fullName,
    payload.phone,
    payload.line1,
    payload.line2,
    payload.city,
    payload.postalCode,
    payload.countryCode,
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-start gap-1">
      <Tag tone="info">Posting to</Tag>
      <address className="mt-1 not-italic">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}

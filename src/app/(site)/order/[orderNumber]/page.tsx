import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Money, Tag } from "@/components/ui";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import { getOrderByToken, STATUS_STEPS, statusLabel } from "@/lib/orders";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

function when(iso: string): string {
  return new Intl.DateTimeFormat("en-CY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const order = t ? await getOrderByToken(orderNumber, t) : null;
  // Wrong token and missing order look identical on purpose: the token is
  // the credential, and a different answer would confirm the number exists.
  if (!order) notFound();

  const reached = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  // payment_link_sent is the owner's own bookkeeping and says nothing the
  // buyer cannot already see in the conversation, so it stays out.
  const updates = order.events
    .filter((e) => e.type !== "payment_link_sent")
    .slice()
    .reverse();
  const address = order.shippingAddress;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
      <div>
        <p className={cn(UTILITY_TEXT, "text-ink")}>Order {order.orderNumber}</p>
        <h1 className="mt-1 text-2xl">{statusLabel(order.status)}</h1>
        <p className="mt-1 text-sm">Placed {when(order.createdAt)}</p>
      </div>

      {order.paymentStatus === "unpaid" && (
        <Card accent="info" className="flex flex-col gap-2">
          <p className="font-semibold">Nothing to pay yet.</p>
          <p>
            I will send a payment link in our conversation once I have checked the order. Posting or
            collecting is sorted out there too.
          </p>
        </Card>
      )}

      <ol className="flex flex-wrap gap-2" aria-label="Progress">
        {STATUS_STEPS.map((step, i) => (
          <li key={step}>
            <Tag tone={i <= reached ? "stock" : "neutral"} size="sm">
              {statusLabel(step)}
            </Tag>
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">What you ordered</h2>
        <ul className="flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span>
                {item.quantity} x {item.title}
                {item.variant ? ` (${item.variant})` : ""}
              </span>
              <Money cents={item.unitCents * item.quantity} className="shrink-0" />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1 border-t-2 border-ink pt-3">
          <div className="flex justify-between">
            <span>Prints</span>
            <Money cents={order.subtotalCents} />
          </div>
          <div className="flex justify-between">
            <span>{order.method?.label ?? "Delivery"}</span>
            <Money cents={order.shippingCents} />
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <Money cents={order.totalCents} />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="text-xl">Delivery</h2>
        {address ? (
          <address className="not-italic">
            {[
              address.fullName,
              address.line1,
              address.line2,
              address.city,
              address.postalCode,
              address.countryCode,
            ]
              .filter((v): v is string => typeof v === "string" && v.length > 0)
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </address>
        ) : (
          <p>Collecting at a market, unless we agree otherwise in the conversation.</p>
        )}
        {order.trackingNumber && (
          <p>
            Tracking:{" "}
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline"
              >
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-mono">{order.trackingNumber}</span>
            )}
          </p>
        )}
      </Card>

      {updates.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl">Updates</h2>
          {/* Newest first: the thing that just changed is the thing they came
              to read. */}
          <ol className="flex flex-col gap-3">
            {updates.map((update, i) => (
              <li key={`${update.at}-${i}`} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="info" size="sm">
                    {update.to ? statusLabel(update.to) : "Update"}
                  </Tag>
                  <span className={cn(UTILITY_TEXT, "text-ink")}>{when(update.at)}</span>
                </div>
                {update.note && <p className="whitespace-pre-line">{update.note}</p>}
                {update.tracking && (
                  <p className="text-sm">
                    Tracking: <span className="font-mono">{update.tracking}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {order.conversationId && (
        <Link href={`/messages/${order.conversationId}`}>
          <Button className="w-full">Message about this order</Button>
        </Link>
      )}

      <p className="text-sm">
        Keep this link. It opens your order without signing in, so do not share it.
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Input, Money, Notice, Select, Tag, Textarea } from "@/components/ui";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import { STATUS_STEPS, statusLabel } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import {
  markPaid,
  markRefunded,
  saveOwnerNote,
  saveTracking,
  sendOrderPaymentLink,
  setStatus,
} from "../actions";
import { orderErrorMessage } from "../messages";
import { CopyBlock } from "./copy-block";

export const metadata: Metadata = { title: "Order", robots: { index: false, follow: false } };

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: order }, { data: items }, { data: events }, { data: convo }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, shipping_methods(label, carrier)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id, title_snapshot, variant_snapshot, unit_price_cents, quantity")
      .eq("order_id", id),
    supabase
      .from("order_events")
      .select("type, payload, created_at")
      .eq("order_id", id)
      .order("created_at"),
    supabase
      .from("conversations")
      .select("id")
      .eq("order_id", id)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);
  if (!order) notFound();

  // Opening it is what marks it seen, the same way the message inbox works.
  // Without this the badge would count every order ever placed, forever.
  if (order.unread_for_owner) {
    await supabase.from("orders").update({ unread_for_owner: false }).eq("id", id);
  }

  const address = (order.shipping_address ?? null) as Record<string, unknown> | null;
  const addr = (k: string) =>
    address && typeof address[k] === "string" ? (address[k] as string) : "";
  const label = [
    order.full_name,
    addr("line1"),
    addr("line2"),
    [addr("postalCode"), addr("city")].filter(Boolean).join(" "),
    addr("countryCode"),
    order.phone,
  ]
    .filter(Boolean)
    .join("\n");
  const errorMessage = orderErrorMessage(error);
  const reached = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={cn(UTILITY_TEXT, "text-ink")}>{order.order_number}</p>
          <h1 className="text-2xl">{order.full_name}</h1>
          <p className="text-sm">
            {order.email} · {order.phone}
          </p>
        </div>
        <Link href="/admin/orders" className="font-semibold underline">
          All orders
        </Link>
      </div>

      {errorMessage && (
        <Notice role="alert">
          <p>{errorMessage}</p>
        </Notice>
      )}

      <div className="flex flex-wrap gap-2">
        <Tag
          tone={
            order.payment_status === "paid"
              ? "stock"
              : order.payment_status === "refunded"
                ? "sale"
                : "neutral"
          }
        >
          {order.payment_status}
        </Tag>
        <Tag tone="info">{statusLabel(order.status)}</Tag>
        <Tag>{order.payment_method}</Tag>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Payment</h2>
        <p className="font-display text-2xl font-extrabold">
          <Money cents={order.total_cents} />
        </p>
        {order.payment_status !== "paid" ? (
          <>
            <form action={sendOrderPaymentLink} className="flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="orderNumber" value={order.order_number} />
              <label className="font-semibold" htmlFor="pay-url">
                Payment link
              </label>
              <Input
                id="pay-url"
                name="url"
                type="url"
                placeholder="https://revolut.me/..."
                required
              />
              <label className="font-semibold" htmlFor="pay-amount">
                Amount in euros
              </label>
              <Input
                id="pay-amount"
                name="amount"
                inputMode="decimal"
                defaultValue={(order.total_cents / 100).toFixed(2)}
                required
              />
              <Button type="submit" variant="secondary" disabled={!convo}>
                Send the link into the conversation
              </Button>
              {!convo && (
                <p className="text-sm">
                  This order has no conversation, so there is nowhere to send it.
                </p>
              )}
            </form>
            <form action={markPaid}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit">Mark as paid</Button>
              <p className="mt-2 text-sm">
                Press this when you have seen the money arrive. Nothing here guesses.
              </p>
            </form>
          </>
        ) : (
          <form action={markRefunded}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" variant="danger">
              Mark as refunded
            </Button>
          </form>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Progress</h2>
        <form action={setStatus} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="font-semibold" htmlFor="status-note">
            Tell them what is happening
          </label>
          <Textarea
            id="status-note"
            name="note"
            rows={2}
            placeholder="Printing today, should be ready Thursday."
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_STEPS.map((step, i) => (
              <Button
                key={step}
                type="submit"
                name="status"
                value={step}
                size="sm"
                variant={i <= reached ? "primary" : "secondary"}
              >
                {statusLabel(step)}
              </Button>
            ))}
          </div>
        </form>
        <p className="text-sm">
          Whichever you press emails them the note and puts it on their order page. Add the tracking
          below before pressing Posted, so it goes out with the email.
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">What they ordered</h2>
        <ul className="flex flex-col gap-1">
          {(items ?? []).map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.quantity} x {i.title_snapshot}
                {i.variant_snapshot ? ` (${i.variant_snapshot})` : ""}
              </span>
              <Money cents={i.unit_price_cents * i.quantity} />
            </li>
          ))}
        </ul>
        {order.buyer_note && (
          <p className="border-t-2 border-ink pt-3 text-sm">
            <span className="font-semibold">They said:</span> {order.buyer_note}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Delivery</h2>
        <p>{order.shipping_methods?.label ?? "Not chosen yet"}</p>
        {address ? (
          <CopyBlock text={label} />
        ) : (
          <p className="text-sm">
            No address. Collecting, unless they fill in delivery details in the conversation.
          </p>
        )}
        <form action={saveTracking} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="font-semibold" htmlFor="carrier">
            Carrier
          </label>
          <Select
            id="carrier"
            name="carrier"
            defaultValue={order.shipping_methods?.carrier ?? "acs"}
          >
            <option value="acs">ACS</option>
            <option value="cypost">Cyprus Post</option>
            <option value="boxnow">BOX NOW</option>
          </Select>
          <label className="font-semibold" htmlFor="tracking">
            Tracking number
          </label>
          <Input
            id="tracking"
            name="tracking"
            defaultValue={order.tracking_number ?? ""}
            placeholder="From the counter receipt"
          />
          <Button type="submit" variant="secondary">
            Save tracking
          </Button>
        </form>
        {order.tracking_url && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Open tracking
          </a>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">Your notes</h2>
        <form action={saveOwnerNote} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <Textarea
            name="note"
            rows={3}
            defaultValue={order.owner_note ?? ""}
            placeholder="Only you see this"
          />
          <Button type="submit" variant="secondary">
            Save note
          </Button>
        </form>
      </Card>

      {convo && (
        <Link href={`/admin/messages/${convo.id}`} className="font-semibold underline">
          Open the conversation
        </Link>
      )}

      <Card className="flex flex-col gap-2">
        <h2 className="text-xl">History</h2>
        <ol className="flex flex-col gap-1 text-sm">
          <li className={UTILITY_TEXT}>
            placed · {new Date(order.created_at ?? "").toLocaleString("en-CY")}
          </li>
          {(events ?? []).map((e, i) => (
            <li key={i} className={UTILITY_TEXT}>
              {e.type} · {new Date(e.created_at ?? "").toLocaleString("en-CY")}
            </li>
          ))}
        </ol>
      </Card>
    </main>
  );
}

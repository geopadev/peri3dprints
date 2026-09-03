import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, Input, Money, Tag } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import { statusLabel } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

const TABS = [
  {
    key: "open",
    label: "Open",
    statuses: ["pending", "awaiting_payment", "paid", "printing", "ready"],
  },
  { key: "shipped", label: "Posted", statuses: ["shipped"] },
  { key: "done", label: "Done", statuses: ["delivered", "cancelled", "refunded"] },
  { key: "all", label: "All", statuses: [] },
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab = "open", q = "" } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, full_name, phone, status, payment_status, total_cents, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (active.statuses.length > 0) query = query.in("status", [...active.statuses]);
  if (q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`order_number.ilike.${term},full_name.ilike.${term},phone.ilike.${term}`);
  }
  const { data: orders } = await query;
  const rows = orders ?? [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8">
      <h1 className="text-2xl">Orders</h1>

      <form className="flex gap-2" role="search">
        <input type="hidden" name="tab" value={active.key} />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Order number, name or phone"
          aria-label="Search orders"
        />
      </form>

      <nav aria-label="Order status" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/orders?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={t.key === active.key ? "page" : undefined}
            className={cn(
              `inline-flex min-h-11 items-center rounded-pill border-2 border-ink px-4 ${UTILITY_TEXT}`,
              t.key === active.key ? "bg-ink text-paper" : "bg-surface text-ink",
              FOCUS_RING,
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title="No orders here"
          description="Orders land here when someone asks to buy."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className={cn("block", FOCUS_RING)}>
                <Card interactive className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn(UTILITY_TEXT, "text-ink")}>{o.order_number}</span>
                    <Money cents={o.total_cents} className="font-semibold" />
                  </div>
                  <p className="truncate font-semibold">{o.full_name}</p>
                  <div className="flex flex-wrap gap-2">
                    <Tag
                      tone={
                        o.payment_status === "paid"
                          ? "stock"
                          : o.payment_status === "refunded"
                            ? "sale"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {o.payment_status}
                    </Tag>
                    <Tag tone="info" size="sm">
                      {statusLabel(o.status)}
                    </Tag>
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

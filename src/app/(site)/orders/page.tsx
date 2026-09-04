import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, EmptyState, Money, Tag } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { UTILITY_TEXT } from "@/components/ui/type";
import { cn } from "@/lib/cn";
import { statusLabel } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } };

/**
 * The buyer's own order history. Linked from the account menu, which pointed
 * here from the start, but nothing was ever built to answer it: a signed in
 * buyer clicking Orders got a 404. RLS already scopes orders to their own
 * buyer_id, the same policy the tokenised /order/[orderNumber] page relies
 * on, so this needed no new grant, only the missing page.
 *
 * Each row links to the same /order/[orderNumber] page an email link opens,
 * carrying its own access_token, rather than duplicating that page's detail
 * view here.
 */
export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=%2Forders");

  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, access_token, status, payment_status, total_cents, created_at")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const rows = orders ?? [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
      <h1 className="text-2xl">Your orders</h1>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Orders you place show up here."
          action={
            <Link href="/shop">
              <span className="font-semibold underline">Go to the shop</span>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((order) => (
            <li key={order.order_number}>
              <Link
                href={`/order/${order.order_number}?t=${order.access_token}`}
                className={cn("block", FOCUS_RING)}
              >
                <Card interactive className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn(UTILITY_TEXT, "text-ink")}>{order.order_number}</span>
                    <Money cents={order.total_cents} className="font-semibold" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Tag
                      tone={
                        order.payment_status === "paid"
                          ? "stock"
                          : order.payment_status === "refunded"
                            ? "sale"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {statusLabel(order.status)}
                    </Tag>
                    <span className="text-sm">
                      {new Intl.DateTimeFormat("en-CY", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(order.created_at ?? ""))}
                    </span>
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

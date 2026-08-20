import type { Metadata } from "next";
import Link from "next/link";
import { Card, Tag, UTILITY_TEXT } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Today",
  robots: { index: false, follow: false },
};

/** Orders that are paid or waiting but not yet out of his hands. */
const NEEDS_ACTION: readonly ("pending" | "paid" | "awaiting_payment" | "printing" | "ready")[] = [
  "pending",
  "paid",
  "awaiting_payment",
  "printing",
  "ready",
];

const LOW_STOCK_AT = 3;

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [unread, needsAction, lowStock, drafts] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("unread_for_owner", true),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", NEEDS_ACTION),
    supabase
      .from("products")
      .select("id, title, slug, stock_qty")
      .eq("made_to_order", false)
      .not("stock_qty", "is", null)
      .lte("stock_qty", LOW_STOCK_AT)
      .order("stock_qty", { ascending: true })
      .limit(5),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);

  const lowStockRows = lowStock.data ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
      <h1 className="text-2xl">Today</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className={UTILITY_TEXT}>Messages</p>
          <p className="mt-2 text-3xl">{unread.count ?? 0}</p>
          <p className="mt-1">waiting on a reply</p>
        </Card>

        <Card>
          <p className={UTILITY_TEXT}>Orders</p>
          <p className="mt-2 text-3xl">{needsAction.count ?? 0}</p>
          <p className="mt-1">need something doing</p>
        </Card>

        <Card>
          <p className={UTILITY_TEXT}>Drafts</p>
          <p className="mt-2 text-3xl">{drafts.count ?? 0}</p>
          <p className="mt-1">not on the shelf yet</p>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Running low</h2>
        {lowStockRows.length === 0 ? (
          <Card>
            <p>
              Nothing is running low. Everything with a stock count has more than {LOW_STOCK_AT}.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {lowStockRows.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid"
                >
                  <Card interactive className="flex items-center justify-between gap-4">
                    <span className="font-semibold">{product.title}</span>
                    <Tag tone={product.stock_qty === 0 ? "sale" : "stock"}>
                      {product.stock_qty === 0 ? "None left" : `${product.stock_qty} left`}
                    </Tag>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Money } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { useCart } from "@/hooks/use-cart";
import type { ProductVariantData } from "@/lib/products";

export type ProductPurchasePanelProps = {
  productId: string;
  priceCents: number;
  variants: ProductVariantData[];
  madeToOrder: boolean;
  leadTimeDays: number | null;
  stockQty: number | null;
  whatsappHref: string | null;
};

function stockLine(
  madeToOrder: boolean,
  leadTimeDays: number | null,
  stockQty: number | null,
): string {
  if (madeToOrder) {
    return `Made to order, ready in about ${leadTimeDays ?? 3} days.`;
  }
  if (stockQty === 0) {
    return "Out of stock right now. Message me if you want one anyway.";
  }
  return "In stock, ships in 1 to 2 days.";
}

export function ProductPurchasePanel({
  productId,
  priceCents,
  variants,
  madeToOrder,
  leadTimeDays,
  stockQty,
  whatsappHref,
}: ProductPurchasePanelProps) {
  const { addLine } = useCart();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? null);
  const [added, setAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === selectedId) ?? null;
  const displayPriceCents = priceCents + (selected?.priceDeltaCents ?? 0);
  const soldOut = !madeToOrder && stockQty === 0;

  function onAddToCart() {
    addLine(productId, selectedId, 1);
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <Money cents={displayPriceCents} className="text-2xl" />

      {variants.length > 0 && (
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
          {variants.map((variant) => {
            const isSelected = variant.id === selectedId;
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelectedId(variant.id);
                  setAdded(false);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-pill border-2 border-ink px-3",
                  isSelected ? "bg-ink text-paper" : "bg-surface text-ink",
                  FOCUS_RING,
                )}
              >
                {variant.swatchHex && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-pill border-2 border-ink"
                    style={{ backgroundColor: variant.swatchHex }}
                  />
                )}
                <span>{variant.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <p>{stockLine(madeToOrder, leadTimeDays, stockQty)}</p>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-3">
          <Button onClick={onAddToCart} disabled={soldOut}>
            {soldOut ? "Out of stock" : "Add to cart"}
          </Button>
          {/* Ask about this stays disabled: chat is stage 11 and does not
              exist yet. WhatsApp underneath is what actually works today. */}
          <Button variant="secondary" disabled>
            Ask about this
          </Button>
        </div>

        {added && (
          <p className="text-sm">
            Added.{" "}
            <Link href="/cart" className="font-semibold underline">
              View cart
            </Link>
            .
          </p>
        )}

        <p className="text-sm">
          Chat is not open yet.{" "}
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
            >
              Message me on WhatsApp
            </a>
          ) : (
            "Message me directly for now."
          )}{" "}
          instead.
        </p>
      </div>
    </div>
  );
}

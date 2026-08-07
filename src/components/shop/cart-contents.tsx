"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, EmptyState, Money, Skeleton } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/product-image-url";
import { whatsappLink } from "@/lib/whatsapp-link";
import { createClient } from "@/lib/supabase/browser";
import { useCart } from "@/hooks/use-cart";
import { useHasMounted } from "@/hooks/use-has-mounted";
import type { PricedCart } from "@/lib/cart-pricing";
import { getPricedCart } from "@/app/(site)/cart/actions";

const EMPTY_PRICED: PricedCart = {
  lines: [],
  removed: [],
  subtotalCents: 0,
  totalWeightGrams: 0,
};

export function CartContents({
  whatsappNumber,
  onNavigate,
}: {
  whatsappNumber: string | null;
  /** Called after a link inside is followed, so the slide-over can close itself. */
  onNavigate?: () => void;
}) {
  const mounted = useHasMounted();
  const { lines, hydrated, updateQuantity, removeLine } = useCart();
  const [priced, setPriced] = useState<PricedCart>(EMPTY_PRICED);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // Re-prices from the database whenever the local lines change, including
  // right after hydration reads whatever localStorage had. The ref guards
  // against acting on a stale response if lines change again mid-request.
  const requestId = useRef(0);
  useEffect(() => {
    if (!hydrated) return;
    const id = ++requestId.current;
    void getPricedCart(lines).then((result) => {
      if (id !== requestId.current) return;
      setPriced(result);
      // Cleans the local store so a removed line does not keep coming back
      // as "removed" on every future price check.
      for (const gone of result.removed) removeLine(gone.productId, gone.variantId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lines]);

  if (!mounted || (!hydrated && lines.length > 0)) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (priced.lines.length === 0 && lines.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Message me and I'll print what you want."
        action={
          <Link href="/shop" onClick={onNavigate}>
            <Button>Go to the shop</Button>
          </Link>
        }
      />
    );
  }

  const message = whatsappNumber
    ? whatsappLink(whatsappNumber, "Hi, I have a question about my cart.")
    : null;

  async function askToBuy() {
    const {
      data: { user },
    } = await createClient().auth.getUser();

    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // Checkout is not built yet (stage 9). Signed in visitors land here with
    // nothing broken to click, rather than a button with nowhere to go.
  }

  return (
    <div className="flex flex-col gap-5">
      {priced.removed.length > 0 && (
        <p className="rounded-card border-2 border-magenta p-3">
          {priced.removed.map((item) => item.title).join(", ")}{" "}
          {priced.removed.length === 1 ? "is" : "are"} no longer available and{" "}
          {priced.removed.length === 1 ? "was" : "were"} taken out of your cart.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {priced.lines.map((line) => (
          <li
            key={`${line.productId}-${line.variantId ?? "none"}`}
            className="flex gap-3 rounded-card border-2 border-ink bg-surface p-3"
          >
            <Link
              href={`/product/${line.slug}`}
              onClick={onNavigate}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-card border-2 border-ink bg-paper"
            >
              {line.cover ? (
                <Image
                  src={productImageUrl(line.cover.storagePath, 160)}
                  alt={line.cover.altText}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={`/product/${line.slug}`}
                onClick={onNavigate}
                className="truncate font-semibold"
              >
                {line.title}
              </Link>
              {line.variantName && <p className="text-sm text-ink-soft">{line.variantName}</p>}
              <Money cents={line.unitPriceCents} className="text-sm" />

              <div className="mt-1 flex items-center gap-3">
                <QuantityStepper
                  quantity={line.quantity}
                  onChange={(next) =>
                    startTransition(() => updateQuantity(line.productId, line.variantId, next))
                  }
                />
                <button
                  type="button"
                  onClick={() => startTransition(() => removeLine(line.productId, line.variantId))}
                  className={cn("text-sm font-semibold underline", FOCUS_RING)}
                >
                  Remove
                </button>
              </div>
            </div>

            <Money cents={line.lineTotalCents} className="shrink-0 font-semibold" />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Subtotal</span>
          <Money cents={priced.subtotalCents} className="text-lg font-semibold" />
        </div>
        <p className="text-sm text-ink-soft">Shipping is worked out at checkout.</p>

        <Button onClick={() => void askToBuy()} disabled={pending}>
          Ask to buy
        </Button>

        <p className="text-sm">
          Not sure?{" "}
          {message ? (
            <a href={message} target="_blank" rel="noreferrer" className="font-semibold underline">
              Message me on WhatsApp
            </a>
          ) : (
            "Message me and I'll help you decide."
          )}
        </p>
      </div>
    </div>
  );
}

function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-card border-2 border-ink font-mono",
          FOCUS_RING,
        )}
      >
        −
      </button>
      <span className="w-6 text-center font-mono" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-card border-2 border-ink font-mono",
          FOCUS_RING,
        )}
      >
        +
      </button>
    </div>
  );
}

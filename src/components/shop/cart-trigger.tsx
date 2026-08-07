"use client";

import { useCart } from "@/hooks/use-cart";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { CartPanel } from "./cart-panel";

const ICON_BUTTON = "flex h-11 w-11 items-center justify-center";

export function CartTrigger({ whatsappNumber }: { whatsappNumber: string | null }) {
  const mounted = useHasMounted();
  const { lines } = useCart();
  // Matches the server-rendered 0 until mounted, so hydration cannot mismatch.
  const count = mounted ? lines.reduce((sum, line) => sum + line.quantity, 0) : 0;

  return (
    <CartPanel
      whatsappNumber={whatsappNumber}
      trigger={
        <button
          type="button"
          aria-label={`Cart, ${count} items`}
          className={`relative ${ICON_BUTTON}`}
        >
          <CartIcon />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-pill border-2 border-ink bg-surface font-mono text-[10px] leading-none">
            {count}
          </span>
        </button>
      }
    />
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2 3h2l1.6 9.6a2 2 0 0 0 2 1.7h6.6a2 2 0 0 0 2-1.6L18 6H5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="18" r="1.3" fill="currentColor" />
      <circle cx="14.5" cy="18" r="1.3" fill="currentColor" />
    </svg>
  );
}

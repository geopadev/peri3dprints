"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  addLine,
  getServerSnapshot,
  getSnapshot,
  hydrate,
  isHydrated,
  removeLine,
  subscribe,
  updateQuantity,
  type CartLine,
} from "@/lib/cart-store";

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void hydrate();
  }, []);

  return {
    lines,
    hydrated: isHydrated(),
    addLine,
    updateQuantity,
    removeLine,
  };
}

export type { CartLine };

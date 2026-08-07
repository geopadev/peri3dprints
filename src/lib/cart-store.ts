"use client";

import { createClient } from "@/lib/supabase/browser";

/**
 * Product and variant ids and a quantity, nothing else. Never a price: prices
 * are recomputed from the database every time the cart is priced.
 */
export type CartLine = { productId: string; variantId: string | null; quantity: number };

const GUEST_KEY = "peri3dprints:cart:guest";
const userKey = (userId: string) => `peri3dprints:cart:user:${userId}`;
const EMPTY: CartLine[] = [];

let currentKey = GUEST_KEY;
let lines: CartLine[] = EMPTY;
let hydrated = false;
let hydrating = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function isValidLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    (line.variantId === null || typeof line.variantId === "string") &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

function load(key: string): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidLine) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(currentKey, JSON.stringify(lines));
}

function mergeLines(base: CartLine[], incoming: CartLine[]): CartLine[] {
  const merged = base.map((line) => ({ ...line }));
  for (const line of incoming) {
    const existing = merged.find(
      (candidate) =>
        candidate.productId === line.productId && candidate.variantId === line.variantId,
    );
    if (existing) existing.quantity += line.quantity;
    else merged.push({ ...line });
  }
  return merged;
}

/** Reads the current account cart plus whatever built up while signed out,
 * combines them, and adopts the account key from here on. Local to this
 * browser: there is no server-stored cart to reconcile against, so this does
 * not sync a cart across devices, only across a sign-in on the same one. */
function switchToUser(userId: string) {
  const guestLines = load(GUEST_KEY);
  const accountLines = load(userKey(userId));
  currentKey = userKey(userId);
  lines = mergeLines(accountLines, guestLines);
  save();
  window.localStorage.removeItem(GUEST_KEY);
  emit();
}

function switchToGuest() {
  currentKey = GUEST_KEY;
  lines = load(GUEST_KEY);
  emit();
}

/** Client only, called once. Loads whichever cart matches the current session,
 * then merges on every later sign in for the lifetime of the tab. */
export async function hydrate(): Promise<void> {
  if (hydrated || hydrating) return;
  hydrating = true;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  currentKey = user ? userKey(user.id) : GUEST_KEY;
  lines = load(currentKey);
  hydrated = true;
  hydrating = false;
  emit();

  // The first callback here just reports the state getUser() already
  // established above, so it is ignored to avoid merging twice.
  let sawFirstEvent = false;
  supabase.auth.onAuthStateChange((event, session) => {
    if (!sawFirstEvent) {
      sawFirstEvent = true;
      return;
    }
    if (event === "SIGNED_IN" && session?.user) switchToUser(session.user.id);
    else if (event === "SIGNED_OUT") switchToGuest();
  });
}

export function isHydrated(): boolean {
  return hydrated;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): CartLine[] {
  return lines;
}

export function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

export function addLine(productId: string, variantId: string | null, quantity: number): void {
  const existing = lines.find(
    (line) => line.productId === productId && line.variantId === variantId,
  );
  lines = existing
    ? lines.map((line) =>
        line === existing ? { ...line, quantity: line.quantity + quantity } : line,
      )
    : [...lines, { productId, variantId, quantity }];
  save();
  emit();
}

export function updateQuantity(
  productId: string,
  variantId: string | null,
  quantity: number,
): void {
  lines =
    quantity <= 0
      ? lines.filter((line) => !(line.productId === productId && line.variantId === variantId))
      : lines.map((line) =>
          line.productId === productId && line.variantId === variantId
            ? { ...line, quantity }
            : line,
        );
  save();
  emit();
}

export function removeLine(productId: string, variantId: string | null): void {
  updateQuantity(productId, variantId, 0);
}

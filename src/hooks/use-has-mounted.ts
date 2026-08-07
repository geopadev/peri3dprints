"use client";

import { useEffect, useState } from "react";

/**
 * True only after the first client render. Used to hold cart UI on a
 * skeleton rather than ever showing a wrong "empty" state: the cart cannot
 * know what is really in it until localStorage has been read.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

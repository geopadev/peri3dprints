"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

type IdentityContextValue = {
  /**
   * Returns the current user, signing in anonymously first if there is not one
   * yet. Call this from the interaction that needs an identity, never on mount.
   */
  ensureIdentity: () => Promise<User>;
};

const IdentityContext = createContext<IdentityContextValue | null>(null);

/**
 * Buyers never see a signup form. They get an anonymous Supabase session the
 * first time they do something that needs one, which is adding to the cart or
 * opening a chat, and not before. Signing in on page load would create a junk
 * auth user for every bot that crawls the catalogue.
 *
 * The session lives in the Supabase cookie. Nothing extra goes in localStorage,
 * so there is exactly one place identity is stored and the server reads the same
 * one.
 */
export function IdentityProvider({ children }: { children: React.ReactNode }) {
  // Built on first use, not on render. This provider wraps every page, so
  // constructing the client during render would drag the Supabase env vars into
  // prerendering and break the build for pages that never touch auth.
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  // Dedupes concurrent callers, so two fast clicks cannot create two users.
  const inFlight = useRef<Promise<User> | null>(null);

  const ensureIdentity = useCallback((): Promise<User> => {
    if (inFlight.current) return inFlight.current;

    const attempt = (async (): Promise<User> => {
      clientRef.current ??= createClient();
      const supabase = clientRef.current;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return user;

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        throw new Error("Could not start a session. Check your connection and try again.");
      }
      return data.user;
    })();

    inFlight.current = attempt;
    // Let a failed attempt be retried rather than caching the rejection forever.
    attempt.catch(() => {
      inFlight.current = null;
    });

    return attempt;
  }, []);

  const value = useMemo(() => ({ ensureIdentity }), [ensureIdentity]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity has to be called inside an IdentityProvider.");
  }
  return context;
}

import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/products";
import { signOut } from "@/app/(site)/sign-in/actions";
import { CartTrigger } from "./cart-trigger";

const NAV_LINK =
  "inline-flex min-h-11 items-center px-1 font-mono text-xs tracking-utility uppercase underline";

const ICON_BUTTON = "flex h-11 w-11 items-center justify-center";

/**
 * Server Component: reads the session once per request, no client JS needed
 * for the signed out state and only a plain form for sign out in the signed
 * in state. The search box uses a native <details> disclosure and a GET form
 * for the same reason: no client JS required for either.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    settings,
  ] = await Promise.all([supabase.auth.getUser(), getSettings()]);

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? user.email ?? null;
  }

  return (
    <header className="border-b-2 border-ink bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link
          href="/"
          className={cn("font-display text-lg font-extrabold tracking-display", FOCUS_RING)}
        >
          Peri 3D Prints
        </Link>

        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className={cn(ICON_BUTTON, "list-none", FOCUS_RING)} aria-label="Search">
              <SearchIcon />
            </summary>
            <form
              method="GET"
              action="/shop"
              className="absolute top-full right-0 z-20 mt-2 flex gap-2 rounded-card border-2 border-ink bg-surface p-2 shadow-hard"
            >
              <Input
                type="search"
                name="q"
                placeholder="Search prints"
                aria-label="Search prints"
                className="h-11 w-44"
              />
              <Button type="submit" size="sm">
                Go
              </Button>
            </form>
          </details>

          <CartTrigger whatsappNumber={settings.whatsappNumber} />

          {user ? (
            <nav className="flex items-center gap-4">
              <span className="hidden font-mono text-xs tracking-utility uppercase sm:inline">
                {displayName}
              </span>
              <Link href="/orders" className={cn(NAV_LINK, FOCUS_RING)}>
                Orders
              </Link>
              <Link href="/messages" className={cn(NAV_LINK, FOCUS_RING)}>
                Messages
              </Link>
              <form action={signOut}>
                <button type="submit" className={cn(NAV_LINK, "cursor-pointer", FOCUS_RING)}>
                  Sign out
                </button>
              </form>
            </nav>
          ) : (
            <Link href="/sign-in">
              <Button size="sm" variant="secondary">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

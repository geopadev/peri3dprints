import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/products";
import { signOut } from "@/app/(site)/sign-in/actions";
import { CartTrigger } from "./cart-trigger";

const ICON_BUTTON = "flex h-11 w-11 shrink-0 items-center justify-center";

const MENU_ITEM =
  "flex min-h-11 w-full items-center px-3 font-mono text-xs tracking-utility uppercase";

/**
 * Server Component: reads the session once per request, so the signed out
 * state needs no client JavaScript at all and the signed in state needs only
 * a plain form for sign out. Both the search box and the account menu are
 * native <details> disclosures for the same reason.
 *
 * Everything past the logo is icon-width on a phone. The account links used to
 * sit inline as three separate text links, which overflowed a 390px viewport
 * the moment anyone signed in.
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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link
          href="/"
          className={cn(
            "min-w-0 truncate font-display text-base font-extrabold tracking-display sm:text-lg",
            FOCUS_RING,
          )}
        >
          Peri 3D Prints
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <details className="relative">
            <summary className={cn(ICON_BUTTON, "list-none", FOCUS_RING)} aria-label="Search">
              <SearchIcon />
            </summary>
            <form
              method="GET"
              action="/shop"
              className="absolute top-full right-0 z-30 mt-2 flex gap-2 rounded-card border-2 border-ink bg-surface p-2 shadow-hard"
            >
              <Input
                type="search"
                name="q"
                placeholder="Search prints"
                aria-label="Search prints"
                className="h-11 w-40 sm:w-44"
              />
              <Button type="submit" size="sm">
                Go
              </Button>
            </form>
          </details>

          <CartTrigger whatsappNumber={settings.whatsappNumber} />

          {user ? (
            <details className="relative">
              <summary
                className={cn(ICON_BUTTON, "list-none", FOCUS_RING)}
                aria-label={`Account menu for ${displayName ?? "your account"}`}
              >
                <AccountIcon />
              </summary>
              <nav className="absolute top-full right-0 z-30 mt-2 w-56 rounded-card border-2 border-ink bg-surface py-2 shadow-hard">
                <p className="truncate px-3 pb-2 font-mono text-xs tracking-utility uppercase">
                  {displayName}
                </p>
                <Link href="/account" className={cn(MENU_ITEM, FOCUS_RING)}>
                  Account
                </Link>
                <Link href="/orders" className={cn(MENU_ITEM, FOCUS_RING)}>
                  Orders
                </Link>
                <Link href="/messages" className={cn(MENU_ITEM, FOCUS_RING)}>
                  Messages
                </Link>
                <form action={signOut}>
                  <button type="submit" className={cn(MENU_ITEM, "cursor-pointer", FOCUS_RING)}>
                    Sign out
                  </button>
                </form>
              </nav>
            </details>
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

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3.5 17.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

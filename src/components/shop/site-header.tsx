import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSettings } from "@/lib/products";
import { signOut } from "@/app/(site)/sign-in/actions";
import { CartTrigger } from "./cart-trigger";
import { SiteMenu } from "./site-menu";

const ICON_BUTTON = "flex h-11 w-11 shrink-0 items-center justify-center";

const NAV_LINK =
  "inline-flex min-h-11 items-center px-1 font-mono text-xs tracking-utility uppercase underline";

/**
 * Server Component: reads the session once per request, so the signed out
 * state needs no client JavaScript beyond the cart panel.
 *
 * Two navigations, one per size. Below sm the links move into the drawer,
 * because laying the display name plus three account links inline beside the
 * logo, search and cart overflows a 390px viewport. From sm up they sit in the
 * bar where there is room for them, and the drawer button is hidden.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    settings,
    categories,
  ] = await Promise.all([supabase.auth.getUser(), getSettings(), getCategories()]);

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
        {/* Hard left: the drawer button only exists on a phone, so the name
            sits flush against the edge on every other size. */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="sm:hidden">
            <SiteMenu
              categories={categories}
              signedIn={Boolean(user)}
              displayName={displayName}
              signOutAction={signOut}
            />
          </div>

          <Link
            href="/"
            className={cn(
              "truncate font-display text-base font-extrabold tracking-display sm:text-lg",
              FOCUS_RING,
            )}
          >
            Peri 3D Prints
          </Link>
        </div>

        {/* Hard right: every control in one group, nothing floating in the
            middle of the bar. */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link href="/shop" className={cn(NAV_LINK, "hidden sm:inline-flex", FOCUS_RING)}>
            Shop
          </Link>
          <Link href="/custom" className={cn(NAV_LINK, "hidden sm:inline-flex", FOCUS_RING)}>
            Custom
          </Link>

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
            <nav className="hidden items-center gap-3 sm:flex">
              <span className="hidden max-w-32 truncate font-mono text-xs tracking-utility uppercase lg:inline">
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
            <Link href="/sign-in" className="hidden sm:block">
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

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

/**
 * Server Component: reads the session once per request, so the signed out
 * state needs no client JavaScript beyond the drawer and cart panel.
 *
 * Navigation lives in the drawer rather than in the bar itself, which is what
 * keeps this from overflowing a phone: the bar only ever holds the menu
 * button, the logo, search and the cart.
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
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5">
        <SiteMenu
          categories={categories}
          signedIn={Boolean(user)}
          displayName={displayName}
          signOutAction={signOut}
        />

        <Link
          href="/"
          className={cn(
            "min-w-0 flex-1 truncate font-display text-base font-extrabold tracking-display sm:text-lg",
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

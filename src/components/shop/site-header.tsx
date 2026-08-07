import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSettings } from "@/lib/products";
import { signOut } from "@/app/(site)/sign-in/actions";
import { AccountMenu } from "./account-menu";
import { CartTrigger } from "./cart-trigger";
import { PersonIcon } from "./person-icon";
import { SiteMenu } from "./site-menu";

const ICON_BUTTON = "flex h-11 w-11 shrink-0 items-center justify-center";

/**
 * Server Component: reads the session once per request, so the signed out
 * state needs no client JavaScript beyond the cart panel.
 *
 * Navigation splits by size. Below sm everything lives in the drawer. From sm
 * up the drawer button goes and the account links sit behind the person icon,
 * which keeps the bar to four controls at every width instead of spilling the
 * display name and three links across it.
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
      {/* Full bleed on purpose, not centred to max-w-5xl like the page
          content. The bar holds one thing at each end, so centring it left a
          dead gap outside the logo and the icons on a wide screen. */}
      <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-4">
        {/* Hard left: the drawer button only exists on a phone, so the name
            sits flush against the edge on every other size. */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="sm:hidden">
            <SiteMenu categories={categories} />
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
            <AccountMenu displayName={displayName} signOutAction={signOut} />
          ) : (
            <>
              {/* Same slot, same icon as the account menu it becomes once
                  signed in, so the control does not move on a phone. */}
              <Link
                href="/sign-in"
                aria-label="Sign in"
                className={cn(ICON_BUTTON, "sm:hidden", FOCUS_RING)}
              >
                <PersonIcon />
              </Link>
              <Link href="/sign-in" className="hidden sm:block">
                <Button size="sm" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </>
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

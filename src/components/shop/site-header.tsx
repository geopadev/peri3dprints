import Link from "next/link";
import { Button } from "@/components/ui";
import { FOCUS_RING } from "@/components/ui/focus-ring";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(site)/sign-in/actions";

const NAV_LINK =
  "inline-flex min-h-11 items-center px-1 font-mono text-xs tracking-utility uppercase underline";

/**
 * Server Component: reads the session once per request, no client JS needed
 * for the signed out state and only a plain form for sign out in the signed
 * in state.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    </header>
  );
}

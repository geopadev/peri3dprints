import { AdminNav } from "@/components/admin/admin-nav";
import { requireOwner } from "@/lib/supabase/require-owner";
import { signOut } from "@/app/(site)/sign-in/actions";
import { UTILITY_TEXT } from "@/components/ui/type";

/**
 * Route group, so /admin/not-owner stays outside the guard and cannot redirect
 * to itself. The group name does not appear in the URL.
 */
export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOwner();

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminNav />

      <div className="flex-1">{children}</div>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-4">
          <p className={UTILITY_TEXT}>{user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 cursor-pointer font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan focus-visible:outline-solid"
            >
              Sign out
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}

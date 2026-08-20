import type { Metadata } from "next";
import { Button, Card, EmptyState, Notice, Tag } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/require-owner";
import { changeRole } from "./actions";
import { peopleErrorMessage } from "./messages";

export const metadata: Metadata = {
  title: "People",
  robots: { index: false, follow: false },
};

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await requireOwner("/admin/people");
  const { error } = await searchParams;
  const errorMessage = peopleErrorMessage(error);

  const supabase = await createClient();

  // RLS lets an owner read every profile, so no service role client is needed.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, display_name, email, created_at")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = profiles ?? [];
  const ownerCount = rows.filter((row) => row.role === "owner").length;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <h1 className="text-2xl">People</h1>
      <p>
        Everyone with an account. An owner can see the admin, add prints and answer messages. A
        customer can only shop.
      </p>

      {errorMessage && (
        <Notice role="alert">
          <p>{errorMessage}</p>
        </Notice>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Nobody has signed up yet"
          description="Accounts show up here as soon as people make them."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((person) => {
            const isOwner = person.role === "owner";
            const isSelf = person.id === owner.id;
            // The database refuses this too. Disabling the button as well means
            // he is told why before he presses it rather than after.
            const lastOwner = isOwner && ownerCount <= 1;

            return (
              <li key={person.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {person.display_name ?? person.email ?? "No name"}
                    </p>
                    {/* Not the mono utility voice: that is uppercase, and an
                        email address is not an order number. He may need to
                        read it back to someone. */}
                    {person.email && <p className="mt-1 truncate text-sm">{person.email}</p>}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Tag tone={isOwner ? "stock" : "neutral"}>{isOwner ? "Owner" : "Customer"}</Tag>

                    <form action={changeRole}>
                      <input type="hidden" name="userId" value={person.id} />
                      <input type="hidden" name="role" value={isOwner ? "customer" : "owner"} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={isOwner ? "secondary" : "primary"}
                        disabled={lastOwner}
                      >
                        {isOwner ? "Make a customer" : "Make an owner"}
                      </Button>
                    </form>
                  </div>
                </Card>

                {lastOwner && (
                  <p className="mt-2 text-sm">
                    {isSelf
                      ? "You are the only owner. Make someone else an owner before stepping down."
                      : "This is the only owner left."}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl">Sign in</h1>
          <p className="mt-2">
            New here?{" "}
            <Link
              href={`/sign-up?next=${encodeURIComponent(next)}`}
              className="font-semibold underline"
            >
              Create an account
            </Link>
            .
          </p>
        </div>

        {error === "link" && (
          <p className="rounded-card border-2 border-magenta p-4">
            That link did not work. It may have been used already or expired. Sign in below, or ask
            for a new one if you were resetting your password.
          </p>
        )}

        <SignInForm next={next} />
      </Card>
    </main>
  );
}

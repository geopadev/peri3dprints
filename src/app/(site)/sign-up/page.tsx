import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl">Create an account</h1>
          <p className="mt-2">
            Already have one?{" "}
            <Link
              href={`/sign-in?next=${encodeURIComponent(next)}`}
              className="font-semibold underline"
            >
              Sign in
            </Link>
            .
          </p>
        </div>

        <SignUpForm next={next} />
      </Card>
    </main>
  );
}

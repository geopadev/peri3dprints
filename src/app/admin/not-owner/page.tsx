import type { Metadata } from "next";
import { Button, Card } from "@/components/ui";
import { signOut } from "../login/actions";

export const metadata: Metadata = {
  title: "Not the shop owner",
  robots: { index: false, follow: false },
};

export default function NotOwnerPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl">This account is not the shop owner</h1>
          <p className="mt-2">
            You are signed in, but this email is not set as the owner, so the admin stays closed.
            Sign out and try the address the shop is registered to.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </Card>
    </main>
  );
}

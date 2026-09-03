import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Request sent",
  robots: { index: false, follow: false },
};

export default function CustomSentPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-8">
      <h1 className="text-2xl">Request sent</h1>
      <Card accent="highlight" className="flex flex-col gap-2">
        <p className="font-semibold">Got it.</p>
        <p>
          I will look at it and reply in our conversation, usually within a day or two. Quotes are
          free and you are not committed to anything yet.
        </p>
      </Card>
      <Link href="/messages">
        <Button className="w-full">Open the conversation</Button>
      </Link>
    </main>
  );
}

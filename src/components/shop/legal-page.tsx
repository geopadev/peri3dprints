import { Notice } from "@/components/ui";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 py-8 [&_h2]:mt-4 [&_h2]:text-xl">
      <h1 className="text-2xl">{title}</h1>
      {children}
    </main>
  );
}

/** A clearly marked gap the owner has to fill in before launch. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <Notice tone="info">
      <p className="font-semibold">To fill in before launch</p>
      <p>{children}</p>
    </Notice>
  );
}

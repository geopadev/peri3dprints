"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/** The address laid out for a paper label, with one tap to copy it. */
export function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <pre className="rounded-card border-2 border-ink bg-paper p-3 font-mono text-sm whitespace-pre-wrap">
        {text}
      </pre>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy for the label"}
      </Button>
    </div>
  );
}

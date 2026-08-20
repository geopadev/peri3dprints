"use client";

import { Button } from "@/components/ui";

/**
 * One tap drops a stock sentence into the reply box, which he can then edit.
 * It does not send on its own: at a market he is half looking at the phone,
 * and a reply that sent itself would be worse than no shortcut at all.
 */
export function CannedReplies({ replies, targetId }: { replies: string[]; targetId: string }) {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply) => (
        <Button
          key={reply}
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            const box = document.getElementById(targetId) as HTMLTextAreaElement | null;
            if (!box) return;
            box.value = reply;
            box.focus();
          }}
        >
          {reply.length > 34 ? `${reply.slice(0, 34)}...` : reply}
        </Button>
      ))}
    </div>
  );
}

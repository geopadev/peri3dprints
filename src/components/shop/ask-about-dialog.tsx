"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Textarea,
  UTILITY_TEXT,
} from "@/components/ui";
import { startConversation } from "@/app/(site)/messages/actions";

export type AskAboutDialogProps = {
  productId: string;
  productTitle: string;
  productSlug: string;
  whatsappHref: string | null;
};

/**
 * "Ask about this" on a product page. It is one of the two places the sign in
 * wall lives, per CLAUDE.md section 6, and it keeps the intent: the form
 * carries the product page as `next`, with ?ask=1, so someone bounced to sign
 * in comes back to this print with the box already open.
 */
export function AskAboutDialog({
  productId,
  productTitle,
  productSlug,
  whatsappHref,
}: AskAboutDialogProps) {
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get("ask") === "1");
  const next = `/product/${productSlug}?ask=1`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Ask about this</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Ask about {productTitle}</DialogTitle>
        <DialogDescription>
          It goes straight to me. I reply here, under Messages.
        </DialogDescription>

        <form action={startConversation} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="subject" value={productTitle} />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="ask-body" className="font-semibold">
            What do you want to know
          </label>
          <Textarea
            id="ask-body"
            name="body"
            rows={4}
            required
            placeholder="Can you do this one in dark green?"
          />
          <p className={`${UTILITY_TEXT} text-ink`}>You may be asked to sign in first</p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Send</Button>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">
                  WhatsApp instead
                </Button>
              </a>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { resendConfirmation, type ResendState } from "./actions";

const COOLDOWN_SECONDS = 30;
const INITIAL: ResendState = { status: "idle" };

function storageKey(email: string): string {
  return `peri3dprints:resend-cooldown:${email}`;
}

/** Reads any cooldown left over from before a refresh, so reloading the page
 * cannot be used to skip it. */
function remainingCooldown(email: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(storageKey(email));
  if (!raw) return 0;
  const until = Number(raw);
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

function SubmitButton({ secondsLeft }: { secondsLeft: number }) {
  const { pending } = useFormStatus();
  const disabled = pending || secondsLeft > 0;

  return (
    <Button type="submit" variant="secondary" disabled={disabled}>
      {pending ? "Sending" : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend the email"}
    </Button>
  );
}

export function ResendButton({ email, next }: { email: string; next: string }) {
  const [state, formAction] = useActionState(resendConfirmation, INITIAL);
  const [secondsLeft, setSecondsLeft] = useState(() => remainingCooldown(email));

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (state.status !== "sent") return;
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    window.localStorage.setItem(storageKey(email), String(until));
    setSecondsLeft(COOLDOWN_SECONDS);
  }, [state, email]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <SubmitButton secondsLeft={secondsLeft} />
      {state.status === "sent" && <p className="text-sm">Sent. Give it a minute to arrive.</p>}
      {state.status === "error" && <p className="text-sm">{state.message}</p>}
    </form>
  );
}

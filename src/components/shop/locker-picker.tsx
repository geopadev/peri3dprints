"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";

const WIDGET_SRC = "https://widget-cdn.boxnow.cy/map-widget/client/v1.js";
const WIDGET_ELEMENT_ID = "boxnow-map-widget";

export type ChosenLocker = {
  lockerId: string;
  addressLine1: string | null;
  postalCode: string | null;
};

export type LockerPickerProps = {
  value: ChosenLocker | null;
  onChange: (locker: ChosenLocker | null) => void;
};

type WidgetConfig = {
  parentElement: string;
  partnerId: number;
  type: string;
  afterSelect: (selected: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    _bn_map_widget_config?: WidgetConfig;
  }
}

function readSelection(selected: Record<string, unknown>): ChosenLocker | null {
  const lockerId = selected.boxnowLockerId;
  if (typeof lockerId !== "string" || !lockerId) return null;
  return {
    lockerId,
    addressLine1:
      typeof selected.boxnowLockerAddressLine1 === "string"
        ? selected.boxnowLockerAddressLine1
        : null,
    postalCode:
      typeof selected.boxnowLockerPostalCode === "string" ? selected.boxnowLockerPostalCode : null,
  };
}

/**
 * Wraps the BOX NOW map widget. The whole thing is written so a failure is
 * survivable: if their CDN is down, or the partner id is missing because the
 * account does not exist yet, the buyer gets a plain field for the locker id
 * and a link to find one. Checkout is never blocked by someone else's script.
 */
export function LockerPicker({ value, onChange }: LockerPickerProps) {
  const partnerId = process.env.NEXT_PUBLIC_BOXNOW_PARTNER_ID;
  const [scriptFailed, setScriptFailed] = useState(false);
  const [manualId, setManualId] = useState("");
  const loadStarted = useRef(false);

  useEffect(() => {
    if (!partnerId || loadStarted.current) return;
    loadStarted.current = true;

    window._bn_map_widget_config = {
      parentElement: `#${WIDGET_ELEMENT_ID}`,
      partnerId: Number(partnerId),
      type: "popup",
      afterSelect: (selected) => {
        const locker = readSelection(selected);
        if (locker) onChange(locker);
      },
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.onerror = () => setScriptFailed(true);
    document.body.appendChild(script);
    // Deliberately not removed on unmount: the widget registers globals and
    // tearing the tag out mid-checkout is more likely to break it than help.
  }, [partnerId, onChange]);

  if (value) {
    return (
      <Card className="flex flex-col gap-3">
        <div>
          <p className="font-mono text-xs tracking-utility uppercase">Your locker</p>
          <p className="mt-1 font-semibold">{value.addressLine1 ?? value.lockerId}</p>
          {value.postalCode && <p className="text-sm">{value.postalCode}</p>}
        </div>
        <div>
          <Button type="button" variant="secondary" onClick={() => onChange(null)}>
            Change locker
          </Button>
        </div>
      </Card>
    );
  }

  // No partner id, or their script would not load: ask for the id directly
  // rather than leaving the buyer with a dead button.
  if (!partnerId || scriptFailed) {
    return (
      <div className="flex flex-col gap-3">
        <Field
          label="BOX NOW locker ID"
          hint="Find your nearest locker on the BOX NOW site, then paste its ID here."
        >
          {(control) => (
            <Input
              {...control}
              value={manualId}
              onChange={(event) => setManualId(event.target.value)}
              placeholder="For example 1234"
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={!manualId.trim()}
            onClick={() =>
              onChange({ lockerId: manualId.trim(), addressLine1: null, postalCode: null })
            }
          >
            Use this locker
          </Button>
          <a
            href="https://boxnow.cy/find-a-locker"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center font-semibold underline"
          >
            Find a locker
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div id={WIDGET_ELEMENT_ID} />
      <p className="text-sm">Pick the locker you want to collect from.</p>
    </div>
  );
}

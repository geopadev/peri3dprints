"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the wiring. Spread it onto the control so the labelling holds. */
  children: (control: FieldControlProps) => React.ReactNode;
};

/**
 * Owns the label, hint and error for one control, and the aria wiring between
 * them. A render prop rather than cloneElement, so the types stay honest.
 */
export function Field({ label, hint, error, required = false, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Error is announced before hint, since it is the thing that needs acting on.
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-semibold text-ink">
        {label}
        {required && <span className="text-ink-soft"> (required)</span>}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}

      {hint && (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm font-semibold text-ink">
          {error}
        </p>
      )}
    </div>
  );
}

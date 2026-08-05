import { cn } from "@/lib/cn";

/**
 * Money is integer cents everywhere and only becomes a string here, at the
 * render edge. See CLAUDE.md section 6.
 */
export type MoneyProps = React.ComponentPropsWithRef<"span"> & {
  cents: number;
  /** Mono is the default, since prices sit in tables and spec rows. */
  mono?: boolean;
};

const FORMATTER = new Intl.NumberFormat("en-CY", {
  style: "currency",
  currency: "EUR",
});

export function formatCents(cents: number): string {
  return FORMATTER.format(cents / 100);
}

export function Money({ cents, mono = true, className, ...props }: MoneyProps) {
  return (
    <span className={cn(mono && "font-mono tracking-utility tabular-nums", className)} {...props}>
      {formatCents(cents)}
    </span>
  );
}

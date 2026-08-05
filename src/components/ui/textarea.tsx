import { cn } from "@/lib/cn";
import { CONTROL_BASE } from "./input";
import { FOCUS_RING } from "./focus-ring";

export type TextareaProps = React.ComponentPropsWithRef<"textarea"> & {
  invalid?: boolean;
};

export function Textarea({ invalid = false, rows = 4, className, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        "resize-y py-3",
        invalid ? "border-magenta" : "border-ink",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

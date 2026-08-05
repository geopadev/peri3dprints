export type ClassValue = string | false | null | undefined;

/**
 * Joins class names. There is deliberately no tailwind-merge here, so a
 * `className` passed by a caller appends to the component's own classes rather
 * than replacing them. If you need to override a default, add the variant to
 * the component instead of fighting it from the outside.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

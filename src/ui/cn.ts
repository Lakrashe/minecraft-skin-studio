/** Joins class names, skipping falsy values. Tiny replacement for `clsx`. */
export function cn(...classes: readonly (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

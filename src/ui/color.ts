/** Color helpers used by the design system (theme accent handling). */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (digits === undefined) return null;
  const value = Number.parseInt(digits, 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

const NEAR_BLACK: Rgb = { r: 6, g: 18, b: 10 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };

/** Text color (hex) that reads best on top of the given background color. */
export function readableTextOn(backgroundHex: string): string {
  const bg = parseHex(backgroundHex);
  if (!bg) return '#ffffff';
  return contrastRatio(bg, NEAR_BLACK) >= contrastRatio(bg, WHITE) ? '#06120a' : '#ffffff';
}

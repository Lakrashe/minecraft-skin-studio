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

/** Straight-alpha color, each channel an integer 0–255. */
export interface Rgba extends Rgb {
  readonly a: number;
}

/** Hue 0–360, saturation and value 0–1. */
export interface Hsv {
  readonly h: number;
  readonly s: number;
  readonly v: number;
}

/**
 * Parses `#rgb`, `#rrggbb` or `#rrggbbaa` (the `#` is optional, case is
 * ignored). Returns `null` for anything else.
 */
export function parseHexColor(text: string): Rgba | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text.trim());
  let digits = match?.[1];
  if (digits === undefined) return null;
  if (digits.length === 3) digits = digits.replace(/./g, (c) => c + c);
  const byte = (i: number) => Number.parseInt(digits.slice(i, i + 2), 16);
  return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) : 255 };
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** `#rrggbb`, or `#rrggbbaa` when the color is not fully opaque. Lowercase. */
export function formatHexColor({ r, g, b, a }: Rgba): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a === 255 ? '' : hex2(a)}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const delta = max - Math.min(rn, gn, bn);
  let h = 0;
  if (delta > 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = v - c;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

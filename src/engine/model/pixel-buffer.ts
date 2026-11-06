import { SKIN_HEIGHT, SKIN_WIDTH, type Rect, type Rgba } from './types';

/** RGBA pixels, straight alpha, row-major, 4 bytes per pixel. */
export interface PixelBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

export const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 };

/** A fully transparent buffer (defaults to the 64×64 skin size). */
export function createPixelBuffer(width = SKIN_WIDTH, height = SKIN_HEIGHT): PixelBuffer {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`Invalid buffer size ${String(width)}×${String(height)}`);
  }
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export function clonePixelBuffer(buffer: PixelBuffer): PixelBuffer {
  return { width: buffer.width, height: buffer.height, data: new Uint8ClampedArray(buffer.data) };
}

export function inBounds(buffer: PixelBuffer, x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < buffer.width &&
    y < buffer.height
  );
}

/** Returns the pixel, or `null` when (x, y) is outside the buffer. */
export function getPixel(buffer: PixelBuffer, x: number, y: number): Rgba | null {
  if (!inBounds(buffer, x, y)) return null;
  const i = (y * buffer.width + x) * 4;
  const d = buffer.data;
  return { r: d[i] ?? 0, g: d[i + 1] ?? 0, b: d[i + 2] ?? 0, a: d[i + 3] ?? 0 };
}

/** Writes one pixel. Out-of-bounds writes are ignored and return `false`. */
export function setPixel(buffer: PixelBuffer, x: number, y: number, color: Rgba): boolean {
  if (!inBounds(buffer, x, y)) return false;
  const i = (y * buffer.width + x) * 4;
  buffer.data[i] = color.r;
  buffer.data[i + 1] = color.g;
  buffer.data[i + 2] = color.b;
  buffer.data[i + 3] = color.a;
  return true;
}

/** Fills a rectangle, clipped to the buffer. */
export function fillRect(buffer: PixelBuffer, rect: Rect, color: Rgba): void {
  const x0 = Math.max(0, rect.x);
  const y0 = Math.max(0, rect.y);
  const x1 = Math.min(buffer.width, rect.x + rect.w);
  const y1 = Math.min(buffer.height, rect.y + rect.h);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) setPixel(buffer, x, y, color);
  }
}

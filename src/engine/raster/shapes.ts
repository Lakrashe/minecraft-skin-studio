/**
 * Pixel shapes for drawing tools, in texture coordinates. Pure: they return
 * the texels to paint and never touch a buffer.
 */
import type { PixelBuffer } from '../model/pixel-buffer';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Every texel on the line from `a` to `b`, endpoints included (Bresenham). */
export function linePoints(a: Point, b: Point): Point[] {
  const points: Point[] = [];
  let x = a.x;
  let y = a.y;
  const dx = Math.abs(b.x - a.x);
  const dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1;
  const sy = a.y < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    points.push({ x, y });
    if (x === b.x && y === b.y) return points;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** The rectangle spanned by two corners: its outline, or every texel when `filled`. */
export function rectPoints(a: Point, b: Point, filled: boolean): Point[] {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  const points: Point[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (filled || y === y0 || y === y1 || x === x0 || x === x1) points.push({ x, y });
    }
  }
  return points;
}

/**
 * Flood fill: indices (`y * width + x`) of the texels 4-connected to `start`
 * that have exactly the same RGBA value and that `allowed` accepts. Empty
 * when `start` is outside the buffer or not allowed.
 */
export function floodFillIndices(
  buffer: PixelBuffer,
  start: Point,
  allowed: (index: number) => boolean,
): number[] {
  const { width, height, data } = buffer;
  if (start.x < 0 || start.y < 0 || start.x >= width || start.y >= height) return [];
  const startIndex = start.y * width + start.x;
  if (!allowed(startIndex)) return [];
  const target = data.subarray(startIndex * 4, startIndex * 4 + 4);
  const [r, g, b, a] = [target[0], target[1], target[2], target[3]];
  const same = (i: number) =>
    data[i * 4] === r && data[i * 4 + 1] === g && data[i * 4 + 2] === b && data[i * 4 + 3] === a;

  const seen = new Uint8Array(width * height);
  const result: number[] = [];
  const stack = [startIndex];
  seen[startIndex] = 1;
  for (let i = stack.pop(); i !== undefined; i = stack.pop()) {
    result.push(i);
    const x = i % width;
    const y = (i - x) / width;
    const neighbors = [
      x > 0 ? i - 1 : -1,
      x < width - 1 ? i + 1 : -1,
      y > 0 ? i - width : -1,
      y < height - 1 ? i + width : -1,
    ];
    for (const n of neighbors) {
      if (n < 0 || seen[n] === 1) continue;
      seen[n] = 1;
      if (allowed(n) && same(n)) stack.push(n);
    }
  }
  return result;
}

import { describe, expect, it } from 'vitest';
import {
  clonePixelBuffer,
  createPixelBuffer,
  fillRect,
  getPixel,
  inBounds,
  setPixel,
} from './pixel-buffer';

const RED = { r: 255, g: 0, b: 0, a: 255 };

describe('PixelBuffer', () => {
  it('creates a transparent 64×64 RGBA buffer by default', () => {
    const b = createPixelBuffer();
    expect(b.width).toBe(64);
    expect(b.height).toBe(64);
    expect(b.data.length).toBe(64 * 64 * 4);
    expect(b.data.every((v) => v === 0)).toBe(true);
  });

  it('rejects invalid sizes', () => {
    expect(() => createPixelBuffer(0, 64)).toThrow(RangeError);
    expect(() => createPixelBuffer(64.5, 64)).toThrow(RangeError);
  });

  it('round-trips pixels and ignores out-of-bounds access', () => {
    const b = createPixelBuffer();
    expect(setPixel(b, 3, 5, RED)).toBe(true);
    expect(getPixel(b, 3, 5)).toEqual(RED);
    expect(setPixel(b, 64, 0, RED)).toBe(false);
    expect(setPixel(b, -1, 0, RED)).toBe(false);
    expect(getPixel(b, 0, 64)).toBeNull();
    expect(inBounds(b, 1.5, 0)).toBe(false);
  });

  it('fillRect clips to the buffer', () => {
    const b = createPixelBuffer(4, 4);
    fillRect(b, { x: 2, y: 2, w: 10, h: 10 }, RED);
    expect(getPixel(b, 3, 3)).toEqual(RED);
    expect(getPixel(b, 1, 1)?.a).toBe(0);
  });

  it('clone is independent', () => {
    const a = createPixelBuffer(2, 2);
    const b = clonePixelBuffer(a);
    setPixel(b, 0, 0, RED);
    expect(getPixel(a, 0, 0)?.a).toBe(0);
  });
});

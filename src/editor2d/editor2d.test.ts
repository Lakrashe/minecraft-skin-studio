import { describe, expect, it } from 'vitest';
import {
  createPixelBuffer,
  faceRect,
  fillRect,
  getPixel,
  setPixel,
  type PixelBuffer,
  type SkinModel,
} from '@/engine';
import { composeFlatView } from './flat-view';
import {
  clampZoom,
  fitZoom,
  isDimmed,
  moveTexel,
  screenToTexel,
  visiblePixels,
} from './texture-view-math';

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };

function marked(model: SkinModel) {
  const skin = createPixelBuffer();
  // Top-left pixel of each front face carries a marker.
  const mark = (part: Parameters<typeof faceRect>[0], color = RED) => {
    const r = faceRect(part, 'inner', 'front', model);
    setPixel(skin, r.x, r.y, color);
  };
  mark('head');
  mark('rightArm', BLUE);
  mark('leftArm');
  return skin;
}

describe('composeFlatView', () => {
  it('places the player right arm on the viewer left in the front view', () => {
    const view = composeFlatView(marked('classic'), 'classic', 'front');
    expect(getPixel(view, 4, 0)).toEqual(RED); // head
    expect(getPixel(view, 0, 8)).toEqual(BLUE); // right arm → viewer left
    expect(getPixel(view, 12, 8)).toEqual(RED); // left arm → viewer right
  });

  it('offsets slim arms by one pixel', () => {
    const view = composeFlatView(marked('slim'), 'slim', 'front');
    expect(getPixel(view, 1, 8)).toEqual(BLUE);
    expect(getPixel(view, 0, 8)?.a).toBe(0);
  });

  it('composites the outer layer over the inner layer', () => {
    const skin = createPixelBuffer();
    const inner = faceRect('head', 'inner', 'front', 'classic');
    const outer = faceRect('head', 'outer', 'front', 'classic');
    setPixel(skin, inner.x, inner.y, RED);
    setPixel(skin, outer.x, outer.y, BLUE);
    setPixel(skin, inner.x + 1, inner.y, RED);
    expect(getPixel(composeFlatView(skin, 'classic', 'front'), 4, 0)).toEqual(BLUE);
    expect(getPixel(composeFlatView(skin, 'classic', 'front'), 5, 0)).toEqual(RED);
  });

  const alphaSum = (view: PixelBuffer) => {
    let sum = 0;
    for (let i = 3; i < view.data.length; i += 4) sum += view.data[i] ?? 0;
    return sum;
  };

  /** Every texel opaque, so every face of both layers has pixels. */
  const solid = () => {
    const skin = createPixelBuffer();
    fillRect(skin, { x: 0, y: 0, w: 64, h: 64 }, RED);
    return skin;
  };

  it('hiding both layers leaves the view fully transparent', () => {
    const view = composeFlatView(solid(), 'classic', 'front', {
      showInner: false,
      showOuter: false,
    });
    expect(alphaSum(view)).toBe(0);
  });

  it('hiding the outer layer removes the hat but keeps the face', () => {
    const skin = createPixelBuffer();
    const inner = faceRect('head', 'inner', 'front', 'classic');
    const outer = faceRect('head', 'outer', 'front', 'classic');
    setPixel(skin, inner.x, inner.y, RED);
    setPixel(skin, outer.x, outer.y, BLUE);
    const view = composeFlatView(skin, 'classic', 'front', { showOuter: false });
    expect(getPixel(view, 4, 0)).toEqual(RED);
    const outerOnly = composeFlatView(skin, 'classic', 'front', { showInner: false });
    expect(getPixel(outerOnly, 4, 0)).toEqual(BLUE);
  });

  it('a body-part filter draws only those parts', () => {
    const view = composeFlatView(marked('classic'), 'classic', 'front', {
      visibleParts: new Set(['head'] as const),
    });
    expect(getPixel(view, 4, 0)).toEqual(RED); // head stays
    expect(getPixel(view, 0, 8)?.a).toBe(0); // arm hidden
    const full = composeFlatView(solid(), 'classic', 'front');
    const headOnly = composeFlatView(solid(), 'classic', 'front', {
      visibleParts: new Set(['head'] as const),
    });
    // Only the 8×8 head area (rows 0–7) has pixels.
    for (let y = 8; y < 32; y++) {
      for (let x = 0; x < 16; x++) expect(getPixel(headOnly, x, y)?.a).toBe(0);
    }
    expect(alphaSum(headOnly)).toBeLessThan(alphaSum(full));
  });
});

describe('texture view math', () => {
  it('maps screen pixels to texels and rejects positions outside', () => {
    expect(screenToTexel(0, 0, 8)).toEqual({ x: 0, y: 0 });
    expect(screenToTexel(15.9, 8, 8)).toEqual({ x: 1, y: 1 });
    expect(screenToTexel(64 * 8, 0, 8)).toBeNull();
    expect(screenToTexel(-1, 0, 8)).toBeNull();
  });

  it('clamps zoom and fits the texture into a box', () => {
    expect(clampZoom(0)).toBe(2);
    expect(clampZoom(100)).toBe(24);
    expect(fitZoom(64 * 10 + 32, 2000)).toBe(10);
  });

  it('moves the keyboard texel within bounds', () => {
    expect(moveTexel(null, 1, 0)).toEqual({ x: 1, y: 0 });
    expect(moveTexel({ x: 63, y: 63 }, 1, 1)).toEqual({ x: 63, y: 63 });
  });

  it('hides a skin layer without touching the source', () => {
    const skin = createPixelBuffer();
    const inner = faceRect('head', 'inner', 'front', 'classic');
    const outer = faceRect('head', 'outer', 'front', 'classic');
    setPixel(skin, inner.x, inner.y, RED);
    setPixel(skin, outer.x, outer.y, RED);
    const pixels = visiblePixels(skin, { model: 'classic', showInner: true, showOuter: false });
    expect(pixels[(inner.y * 64 + inner.x) * 4 + 3]).toBe(255);
    expect(pixels[(outer.y * 64 + outer.x) * 4 + 3]).toBe(0);
    expect(getPixel(skin, outer.x, outer.y)?.a).toBe(255);
  });

  it('dims unused texels and parts outside the focus', () => {
    expect(isDimmed(0, 0, 'classic', 'all')).toBe(true); // unused
    expect(isDimmed(8, 8, 'classic', 'all')).toBe(false);
    expect(isDimmed(8, 8, 'classic', 'body')).toBe(true);
    expect(isDimmed(8, 8, 'classic', 'head')).toBe(false);
  });
});

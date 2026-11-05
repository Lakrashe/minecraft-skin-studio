import { describe, expect, it } from 'vitest';
import { SKIN_HEIGHT, SKIN_WIDTH, type Rect, type SkinModel } from '../model/types';
import { allFaceRegions, cuboidFaces, faceRect, partFaces, regionAt } from './regions';

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('cuboidFaces', () => {
  it('unwraps the net per the format doc', () => {
    expect(cuboidFaces(0, 0, { w: 8, h: 8, d: 8 })).toEqual({
      top: { x: 8, y: 0, w: 8, h: 8 },
      bottom: { x: 16, y: 0, w: 8, h: 8 },
      right: { x: 0, y: 8, w: 8, h: 8 },
      front: { x: 8, y: 8, w: 8, h: 8 },
      left: { x: 16, y: 8, w: 8, h: 8 },
      back: { x: 24, y: 8, w: 8, h: 8 },
    });
  });
});

describe('region table (docs/MINECRAFT_SKIN_FORMAT.md §4 examples)', () => {
  it('body base faces', () => {
    expect(partFaces('body', 'inner', 'classic')).toEqual({
      top: { x: 20, y: 16, w: 8, h: 4 },
      bottom: { x: 28, y: 16, w: 8, h: 4 },
      right: { x: 16, y: 20, w: 4, h: 12 },
      front: { x: 20, y: 20, w: 8, h: 12 },
      left: { x: 28, y: 20, w: 4, h: 12 },
      back: { x: 32, y: 20, w: 8, h: 12 },
    });
  });

  it('classic right arm', () => {
    expect(partFaces('rightArm', 'inner', 'classic')).toEqual({
      top: { x: 44, y: 16, w: 4, h: 4 },
      bottom: { x: 48, y: 16, w: 4, h: 4 },
      right: { x: 40, y: 20, w: 4, h: 12 },
      front: { x: 44, y: 20, w: 4, h: 12 },
      left: { x: 48, y: 20, w: 4, h: 12 },
      back: { x: 52, y: 20, w: 4, h: 12 },
    });
  });

  it('slim right arm is 3 px wide', () => {
    expect(partFaces('rightArm', 'inner', 'slim')).toEqual({
      top: { x: 44, y: 16, w: 3, h: 4 },
      bottom: { x: 47, y: 16, w: 3, h: 4 },
      right: { x: 40, y: 20, w: 4, h: 12 },
      front: { x: 44, y: 20, w: 3, h: 12 },
      left: { x: 47, y: 20, w: 4, h: 12 },
      back: { x: 51, y: 20, w: 3, h: 12 },
    });
  });

  it('overlay origins', () => {
    expect(faceRect('head', 'outer', 'front', 'classic')).toEqual({ x: 40, y: 8, w: 8, h: 8 });
    expect(faceRect('body', 'outer', 'front', 'classic')).toEqual({ x: 20, y: 36, w: 8, h: 12 });
    expect(faceRect('leftArm', 'outer', 'front', 'classic')).toEqual({ x: 52, y: 52, w: 4, h: 12 });
    expect(faceRect('leftLeg', 'outer', 'front', 'classic')).toEqual({ x: 4, y: 52, w: 4, h: 12 });
    expect(faceRect('leftLeg', 'inner', 'front', 'classic')).toEqual({ x: 20, y: 52, w: 4, h: 12 });
  });
});

describe.each<SkinModel>(['classic', 'slim'])('%s model', (model) => {
  const regions = allFaceRegions(model);

  it('has 72 face regions, all inside the 64×64 texture', () => {
    expect(regions).toHaveLength(72);
    for (const { rect } of regions) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(SKIN_WIDTH);
      expect(rect.y + rect.h).toBeLessThanOrEqual(SKIN_HEIGHT);
    }
  });

  it('no two faces overlap', () => {
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const a = regions[i];
        const b = regions[j];
        if (!a || !b) continue;
        expect(
          overlaps(a.rect, b.rect),
          `${a.part}.${a.layer}.${a.face} vs ${b.part}.${b.layer}.${b.face}`,
        ).toBe(false);
      }
    }
  });

  it('regionAt finds the face for every pixel of every region', () => {
    for (const region of regions) {
      const { x, y, w, h } = region.rect;
      for (const [px, py] of [
        [x, y],
        [x + w - 1, y + h - 1],
      ] as const) {
        expect(regionAt(px, py, model)).toEqual(region);
      }
    }
  });

  it('regionAt returns null for unused pixels', () => {
    expect(regionAt(0, 0, model)).toBeNull(); // corner left of the head top
    expect(regionAt(63, 16, model)).toBeNull(); // right of the right-arm top/bottom row
  });
});

it('slim frees the arm columns that classic uses', () => {
  expect(regionAt(55, 20, 'classic')?.part).toBe('rightArm');
  expect(regionAt(55, 20, 'slim')).toBeNull();
});

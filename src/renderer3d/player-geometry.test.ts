import { describe, expect, it } from 'vitest';
import { BOX_FACE_ORDER, boxUvs, partUvs, playerLayout } from './player-geometry';

const byPart = (model: 'classic' | 'slim') =>
  Object.fromEntries(playerLayout(model).map((l) => [l.part, l]));

describe('playerLayout', () => {
  it('stacks a 32-unit-tall player with feet at y = 0', () => {
    const p = byPart('classic');
    const bottom = (k: string) =>
      (p[k]?.pivot[1] ?? 0) + (p[k]?.offset[1] ?? 0) - (p[k]?.size[1] ?? 0) / 2;
    const top = (k: string) =>
      (p[k]?.pivot[1] ?? 0) + (p[k]?.offset[1] ?? 0) + (p[k]?.size[1] ?? 0) / 2;
    expect(bottom('rightLeg')).toBe(0);
    expect(top('rightLeg')).toBe(bottom('body'));
    expect(top('body')).toBe(bottom('head'));
    expect(top('head')).toBe(32);
  });

  it.each(['classic', 'slim'] as const)('%s arms touch the body sides', (model) => {
    const p = byPart(model);
    const right = p['rightArm'];
    const left = p['leftArm'];
    if (!right || !left) throw new Error('missing arms');
    expect(right.pivot[0] + right.offset[0] + right.size[0] / 2).toBe(-4);
    expect(left.pivot[0] + left.offset[0] - left.size[0] / 2).toBe(4);
  });

  it('slim arms are 3 units wide', () => {
    expect(byPart('slim')['rightArm']?.size).toEqual([3, 12, 4]);
    expect(byPart('classic')['rightArm']?.size).toEqual([4, 12, 4]);
  });
});

describe('boxUvs', () => {
  it('maps faces in Three.js BoxGeometry order (+x, −x, +y, −y, +z, −z)', () => {
    expect(BOX_FACE_ORDER).toEqual(['left', 'right', 'top', 'bottom', 'front', 'back']);
  });

  it('produces 4 UVs per face with the head front at (8,8)-(16,16)', () => {
    const uvs = partUvs('head', 'inner', 'classic');
    expect(uvs).toHaveLength(6 * 4 * 2);
    const front = Array.from(uvs.slice(4 * 8, 5 * 8));
    // top-left, top-right, bottom-left, bottom-right; row 0 is v = 0.
    expect(front).toEqual([8 / 64, 8 / 64, 16 / 64, 8 / 64, 8 / 64, 16 / 64, 16 / 64, 16 / 64]);
  });

  it('flips the bottom face vertically', () => {
    const uvs = partUvs('head', 'inner', 'classic');
    const bottom = Array.from(uvs.slice(3 * 8, 4 * 8));
    expect(bottom).toEqual([16 / 64, 8 / 64, 24 / 64, 8 / 64, 16 / 64, 0, 24 / 64, 0]);
  });

  it('uses the net "right" face for −x (player right side)', () => {
    const uvs = boxUvs({
      top: { x: 0, y: 0, w: 1, h: 1 },
      bottom: { x: 0, y: 0, w: 1, h: 1 },
      right: { x: 40, y: 0, w: 1, h: 1 },
      front: { x: 0, y: 0, w: 1, h: 1 },
      left: { x: 50, y: 0, w: 1, h: 1 },
      back: { x: 0, y: 0, w: 1, h: 1 },
    });
    expect(uvs[0]).toBe(50 / 64); // +x ← left
    expect(uvs[8]).toBe(40 / 64); // −x ← right
  });
});

/**
 * Mirror symmetry across the player's vertical center plane (ARCHITECTURE §4.2).
 *
 * The four side faces of a cuboid form one strip around it, in the net order
 * right | front | left | back. Mirroring the player left↔right reverses that
 * strip: each face is flipped horizontally and `right`/`left` swap places,
 * while `front`/`back` stay. `top`/`bottom` are flipped horizontally in place.
 *
 * - Head and body mirror onto themselves (left half ↔ right half).
 * - Right arm ↔ left arm and right leg ↔ left leg, on the same skin layer.
 */
import { allFaceRegions, partFaces, partSize } from '../format/regions';
import { SKIN_HEIGHT, SKIN_WIDTH, type BodyPart, type Face, type SkinModel } from '../model/types';

/** The part each body part mirrors onto. */
export const MIRROR_PART: Readonly<Record<BodyPart, BodyPart>> = {
  head: 'head',
  body: 'body',
  rightArm: 'leftArm',
  leftArm: 'rightArm',
  rightLeg: 'leftLeg',
  leftLeg: 'rightLeg',
};

type SideFace = 'right' | 'front' | 'left' | 'back';
const SIDE_FACES: readonly SideFace[] = ['right', 'front', 'left', 'back'];

/**
 * Mirrors column `fx` of `face` on a cuboid `w` wide and `d` deep. Returns
 * the face and column on the mirrored part; the row does not change.
 */
export function mirrorFacePosition(
  face: Face,
  fx: number,
  w: number,
  d: number,
): { face: Face; fx: number } {
  if (face === 'top' || face === 'bottom') return { face, fx: w - 1 - fx };
  const start: Record<SideFace, number> = { right: 0, front: d, left: d + w, back: 2 * d + w };
  const width: Record<SideFace, number> = { right: d, front: w, left: d, back: w };
  const length = 2 * d + 2 * w;
  // Reflect about the center of the front face, wrapping around the strip.
  const s = (((2 * d + w - 1 - (start[face] + fx)) % length) + length) % length;
  for (const target of SIDE_FACES) {
    if (s >= start[target] && s < start[target] + width[target]) {
      return { face: target, fx: s - start[target] };
    }
  }
  throw new Error('unreachable: strip position outside every face');
}

const cache = new Map<SkinModel, Int32Array>();

/**
 * `map[y * 64 + x]` is the index of the mirrored texel, or −1 for unused
 * pixels. Mirroring twice returns the same texel. Shared; do not modify.
 */
export function mirrorMap(model: SkinModel): Readonly<Int32Array> {
  const cached = cache.get(model);
  if (cached) return cached;
  const map = new Int32Array(SKIN_WIDTH * SKIN_HEIGHT).fill(-1);
  for (const { part, layer, face, rect } of allFaceRegions(model)) {
    const { w, d } = partSize(part, model);
    const targets = partFaces(MIRROR_PART[part], layer, model);
    for (let fy = 0; fy < rect.h; fy++) {
      for (let fx = 0; fx < rect.w; fx++) {
        const m = mirrorFacePosition(face, fx, w, d);
        const t = targets[m.face];
        map[(rect.y + fy) * SKIN_WIDTH + rect.x + fx] = (t.y + fy) * SKIN_WIDTH + t.x + m.fx;
      }
    }
  }
  cache.set(model, map);
  return map;
}

/** The mirrored texel of (x, y), or `null` for unused or out-of-range texels. */
export function mirrorPoint(
  x: number,
  y: number,
  model: SkinModel,
): { readonly x: number; readonly y: number } | null {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= SKIN_WIDTH || y >= SKIN_HEIGHT) return null;
  const index = mirrorMap(model)[y * SKIN_WIDTH + x] ?? -1;
  return index < 0 ? null : { x: index % SKIN_WIDTH, y: Math.floor(index / SKIN_WIDTH) };
}

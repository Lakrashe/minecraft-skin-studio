/**
 * Texel ↔ body surface (pure math, no Three.js).
 *
 * `texelSurface` says where a texture pixel appears on the player: which part,
 * layer and face, the 3D point at the texel's center and the outward normal.
 * `uvToTexel` goes back from a texture coordinate (e.g. a raycast hit) to the
 * texel. Together they let tests prove that every pixel lands on the right
 * body surface, and they are the basis for painting on the 3D model later.
 *
 * Orientation, as seen from outside the model: side faces upright with the
 * texture's left edge on the viewer's left; top and bottom faces with the
 * player's right side (−x) on the texture's left and the back (−z) on its top
 * row (docs/MINECRAFT_SKIN_FORMAT.md §3).
 */
import {
  SKIN_HEIGHT,
  SKIN_WIDTH,
  regionAt,
  type BodyPart,
  type Face,
  type SkinLayer,
  type SkinModel,
} from '@/engine';
import { playerLayout } from './player-geometry';

export type Vec3 = readonly [number, number, number];

/** Outward normal, and the viewer's right and up directions looking at the face from outside. */
export const FACE_FRAMES: Readonly<Record<Face, { normal: Vec3; right: Vec3; up: Vec3 }>> = {
  front: { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  back: { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
  left: { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] }, // player's left side
  right: { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] }, // player's right side
  top: { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
  bottom: { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, -1] },
};

export interface TexelSurface {
  readonly part: BodyPart;
  readonly layer: SkinLayer;
  readonly face: Face;
  /** World position of the texel's center on the surface (neutral pose). */
  readonly point: Vec3;
  readonly normal: Vec3;
}

const add = (a: Vec3, b: Vec3, k = 1): Vec3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const absDot = (half: Vec3, d: Vec3) =>
  Math.abs(half[0] * d[0]) + Math.abs(half[1] * d[1]) + Math.abs(half[2] * d[2]);

/**
 * Where texel (x, y) appears on the player in the neutral pose, or `null` for
 * texels no face uses.
 */
export function texelSurface(model: SkinModel, x: number, y: number): TexelSurface | null {
  const region = regionAt(x, y, model);
  if (!region) return null;
  const { part, layer, face, rect } = region;
  const layout = playerLayout(model).find((l) => l.part === part);
  if (!layout) return null;
  const inflate = layer === 'outer' ? layout.outerInflate : 0;
  const half: Vec3 = [
    layout.size[0] / 2 + inflate,
    layout.size[1] / 2 + inflate,
    layout.size[2] / 2 + inflate,
  ];
  const center = add(layout.pivot, layout.offset);
  const { normal, right, up } = FACE_FRAMES[face];
  const faceWidth = 2 * absDot(half, right);
  const faceHeight = 2 * absDot(half, up);
  // Fraction across the face (0 = left / top edge as seen from outside).
  const fx = (x - rect.x + 0.5) / rect.w;
  const fy = (y - rect.y + 0.5) / rect.h;
  let point = add(center, normal, absDot(half, normal));
  point = add(point, right, (fx - 0.5) * faceWidth);
  point = add(point, up, (0.5 - fy) * faceHeight);
  return { part, layer, face, point, normal };
}

/** The texel a texture coordinate falls in (row 0 is v = 0, as the renderer uploads it). */
export function uvToTexel(u: number, v: number): { x: number; y: number } {
  return {
    x: Math.min(SKIN_WIDTH - 1, Math.max(0, Math.floor(u * SKIN_WIDTH))),
    y: Math.min(SKIN_HEIGHT - 1, Math.max(0, Math.floor(v * SKIN_HEIGHT))),
  };
}

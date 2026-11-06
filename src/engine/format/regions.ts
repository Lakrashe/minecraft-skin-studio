/**
 * UV region tables for 64×64 Java Edition skins.
 * Single source of truth for where every face lives in the texture —
 * the 2D editor, the 3D renderer and all texture tools derive from this.
 * See docs/MINECRAFT_SKIN_FORMAT.md §3–4.
 */
import {
  BODY_PARTS,
  FACES,
  SKIN_LAYERS,
  type BodyPart,
  type Face,
  type Rect,
  type SkinLayer,
  type SkinModel,
} from '../model/types';

/** Cuboid size in pixels: width (x), height (y), depth (z). */
export interface BoxSize {
  readonly w: number;
  readonly h: number;
  readonly d: number;
}

interface PartSpec {
  readonly size: BoxSize;
  readonly inner: readonly [number, number];
  readonly outer: readonly [number, number];
}

const LIMB = { w: 4, h: 12, d: 4 } as const;
const SLIM_ARM = { w: 3, h: 12, d: 4 } as const;

const PARTS: Readonly<Record<SkinModel, Readonly<Record<BodyPart, PartSpec>>>> = {
  classic: {
    head: { size: { w: 8, h: 8, d: 8 }, inner: [0, 0], outer: [32, 0] },
    body: { size: { w: 8, h: 12, d: 4 }, inner: [16, 16], outer: [16, 32] },
    rightArm: { size: LIMB, inner: [40, 16], outer: [40, 32] },
    leftArm: { size: LIMB, inner: [32, 48], outer: [48, 48] },
    rightLeg: { size: LIMB, inner: [0, 16], outer: [0, 32] },
    leftLeg: { size: LIMB, inner: [16, 48], outer: [0, 48] },
  },
  slim: {
    head: { size: { w: 8, h: 8, d: 8 }, inner: [0, 0], outer: [32, 0] },
    body: { size: { w: 8, h: 12, d: 4 }, inner: [16, 16], outer: [16, 32] },
    rightArm: { size: SLIM_ARM, inner: [40, 16], outer: [40, 32] },
    leftArm: { size: SLIM_ARM, inner: [32, 48], outer: [48, 48] },
    rightLeg: { size: LIMB, inner: [0, 16], outer: [0, 32] },
    leftLeg: { size: LIMB, inner: [16, 48], outer: [0, 48] },
  },
};

/** Unwraps a cuboid net starting at (u, v) — format doc §3. */
export function cuboidFaces(u: number, v: number, { w, h, d }: BoxSize): Record<Face, Rect> {
  return {
    top: { x: u + d, y: v, w, h: d },
    bottom: { x: u + d + w, y: v, w, h: d },
    right: { x: u, y: v + d, w: d, h },
    front: { x: u + d, y: v + d, w, h },
    left: { x: u + d + w, y: v + d, w: d, h },
    back: { x: u + 2 * d + w, y: v + d, w, h },
  };
}

export function partSize(part: BodyPart, model: SkinModel): BoxSize {
  return PARTS[model][part].size;
}

/** All six face rects of one part on one skin layer. */
export function partFaces(part: BodyPart, layer: SkinLayer, model: SkinModel): Record<Face, Rect> {
  const spec = PARTS[model][part];
  const [u, v] = spec[layer];
  return cuboidFaces(u, v, spec.size);
}

export function faceRect(part: BodyPart, layer: SkinLayer, face: Face, model: SkinModel): Rect {
  return partFaces(part, layer, model)[face];
}

export interface FaceRegion {
  readonly part: BodyPart;
  readonly layer: SkinLayer;
  readonly face: Face;
  readonly rect: Rect;
}

const regionCache = new Map<SkinModel, readonly FaceRegion[]>();

/** Every face region of the model (6 parts × 2 layers × 6 faces = 72). */
export function allFaceRegions(model: SkinModel): readonly FaceRegion[] {
  const cached = regionCache.get(model);
  if (cached) return cached;
  const regions: FaceRegion[] = [];
  for (const part of BODY_PARTS) {
    for (const layer of SKIN_LAYERS) {
      const faces = partFaces(part, layer, model);
      for (const face of FACES) regions.push({ part, layer, face, rect: faces[face] });
    }
  }
  regionCache.set(model, regions);
  return regions;
}

export function rectContains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
}

/** Which face (if any) a texture pixel belongs to; `null` for unused pixels. */
export function regionAt(x: number, y: number, model: SkinModel): FaceRegion | null {
  return allFaceRegions(model).find((r) => rectContains(r.rect, x, y)) ?? null;
}

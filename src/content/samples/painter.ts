/**
 * Small helper for painting original sample skins in code. Every write goes
 * through the engine region tables, so samples are UV-correct by construction.
 */
import {
  createPixelBuffer,
  partFaces,
  setPixel,
  type BodyPart,
  type Face,
  type PixelBuffer,
  type Rgba,
  type SkinLayer,
  type SkinModel,
} from '@/engine';

export function hex(value: string): Rgba {
  const n = Number.parseInt(value.replace('#', ''), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 255 };
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

/** Multiplies RGB by `factor` (>1 lighter, <1 darker); alpha unchanged. */
export function shade(color: Rgba, factor: number): Rgba {
  return {
    r: clamp(color.r * factor),
    g: clamp(color.g * factor),
    b: clamp(color.b * factor),
    a: color.a,
  };
}

/** Deterministic PRNG (mulberry32) so samples are identical on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple directional shading so flat colors read as volume in 3D. */
const FACE_LIGHT: Readonly<Record<Face, number>> = {
  top: 1.12,
  front: 1,
  right: 0.9,
  left: 0.9,
  back: 0.86,
  bottom: 0.78,
};

export const SIDE_FACES: readonly Face[] = ['front', 'right', 'back', 'left'];

export class SkinPainter {
  readonly buffer: PixelBuffer = createPixelBuffer();
  readonly model: SkinModel;
  private readonly random: () => number;

  constructor(model: SkinModel, seed: number) {
    this.model = model;
    this.random = seededRandom(seed);
  }

  private textured(color: Rgba, face: Face, noise: number): Rgba {
    const jitter = noise > 0 ? 1 + (this.random() * 2 - 1) * noise : 1;
    return shade(color, FACE_LIGHT[face] * jitter);
  }

  /** Face-relative pixel (fx, fy from the face's top-left). Out-of-face writes are ignored. */
  pixel(part: BodyPart, layer: SkinLayer, face: Face, fx: number, fy: number, color: Rgba): void {
    const rect = partFaces(part, layer, this.model)[face];
    if (fx < 0 || fy < 0 || fx >= rect.w || fy >= rect.h) return;
    setPixel(this.buffer, rect.x + fx, rect.y + fy, color);
  }

  /** Fills a face-relative rectangle with shaded, lightly textured color. */
  rect(
    part: BodyPart,
    layer: SkinLayer,
    face: Face,
    x: number,
    y: number,
    w: number,
    h: number,
    color: Rgba,
    noise = 0.04,
  ): void {
    for (let fy = y; fy < y + h; fy++) {
      for (let fx = x; fx < x + w; fx++) {
        this.pixel(part, layer, face, fx, fy, this.textured(color, face, noise));
      }
    }
  }

  face(part: BodyPart, layer: SkinLayer, face: Face, color: Rgba, noise = 0.04): void {
    const rect = partFaces(part, layer, this.model)[face];
    this.rect(part, layer, face, 0, 0, rect.w, rect.h, color, noise);
  }

  /** All six faces of a part. */
  part(part: BodyPart, layer: SkinLayer, color: Rgba, noise = 0.04): void {
    for (const face of ['top', 'bottom', ...SIDE_FACES] as const)
      this.face(part, layer, face, color, noise);
  }

  /** Horizontal band across the four side faces, rows [from, to) of the face height. */
  band(
    part: BodyPart,
    layer: SkinLayer,
    from: number,
    to: number,
    color: Rgba,
    noise = 0.04,
  ): void {
    for (const face of SIDE_FACES) {
      const rect = partFaces(part, layer, this.model)[face];
      this.rect(part, layer, face, 0, from, rect.w, to - from, color, noise);
    }
  }

  /** Paints the same part on both sides (rightArm+leftArm or rightLeg+leftLeg). */
  pair(parts: readonly [BodyPart, BodyPart], fn: (part: BodyPart) => void): void {
    for (const part of parts) fn(part);
  }
}

export const ARMS = ['rightArm', 'leftArm'] as const;
export const LEGS = ['rightLeg', 'leftLeg'] as const;

export interface FaceStyle {
  readonly skin: Rgba;
  readonly eyes: Rgba;
  readonly brows: Rgba;
  readonly eyeWhite?: Rgba;
}

/** Standard face on the head front (8×8): brows, eyes, nose shadow, mouth. */
export function paintFace(
  p: SkinPainter,
  { skin, eyes, brows, eyeWhite = hex('#f4f1ea') }: FaceStyle,
): void {
  p.face('head', 'inner', 'front', skin, 0.025);
  for (const x of [1, 2, 5, 6]) p.pixel('head', 'inner', 'front', x, 3, shade(brows, 1));
  p.pixel('head', 'inner', 'front', 1, 4, eyeWhite);
  p.pixel('head', 'inner', 'front', 2, 4, eyes);
  p.pixel('head', 'inner', 'front', 5, 4, eyes);
  p.pixel('head', 'inner', 'front', 6, 4, eyeWhite);
  p.pixel('head', 'inner', 'front', 3, 5, shade(skin, 0.9));
  p.pixel('head', 'inner', 'front', 4, 5, shade(skin, 0.9));
  p.pixel('head', 'inner', 'front', 3, 6, shade(skin, 0.72));
  p.pixel('head', 'inner', 'front', 4, 6, shade(skin, 0.72));
}

/** Short hair on the inner head: top, upper sides, back and a fringe on the front. */
export function paintHair(p: SkinPainter, hair: Rgba, length: 'short' | 'long'): void {
  p.face('head', 'inner', 'top', hair, 0.08);
  const sideRows = length === 'long' ? 6 : 3;
  const backRows = length === 'long' ? 8 : 5;
  for (const face of ['right', 'left'] as const)
    p.rect('head', 'inner', face, 0, 0, 8, sideRows, hair, 0.08);
  p.rect('head', 'inner', 'back', 0, 0, 8, backRows, hair, 0.08);
  p.rect('head', 'inner', 'front', 0, 0, 8, 2, hair, 0.08);
  p.pixel('head', 'inner', 'front', 0, 2, shade(hair, 0.95));
  p.pixel('head', 'inner', 'front', 7, 2, shade(hair, 0.95));
  if (length === 'long') {
    for (const y of [2, 3, 4, 5]) {
      p.pixel('head', 'inner', 'front', 0, y, shade(hair, 0.9));
      p.pixel('head', 'inner', 'front', 7, y, shade(hair, 0.9));
    }
  }
}

/** Skin-colored bottoms of the head and hands so no face is left transparent. */
export function paintSkinBase(p: SkinPainter, skin: Rgba): void {
  p.part('head', 'inner', skin, 0.02);
  for (const arm of ARMS) p.face(arm, 'inner', 'bottom', skin, 0.02);
}

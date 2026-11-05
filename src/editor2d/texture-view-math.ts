/** Pure helpers for the 2D texture view (unit-tested). */
import {
  BODY_PARTS,
  SKIN_HEIGHT,
  SKIN_WIDTH,
  regionAt,
  type BodyPart,
  type PixelBuffer,
  type SkinLayer,
  type SkinModel,
} from '@/engine';

export const MIN_ZOOM = 2;
export const MAX_ZOOM = 24;

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(zoom)));
}

/** Largest integer zoom at which the 64×64 texture fits in the given box. */
export function fitZoom(width: number, height: number, padding = 32): number {
  const available = Math.min(width - padding, height - padding);
  return clampZoom(Math.floor(available / SKIN_WIDTH));
}

export interface Texel {
  readonly x: number;
  readonly y: number;
}

/** Converts a position in CSS pixels (relative to the canvas) to a texel, or null outside. */
export function screenToTexel(px: number, py: number, zoom: number): Texel | null {
  const x = Math.floor(px / zoom);
  const y = Math.floor(py / zoom);
  if (x < 0 || y < 0 || x >= SKIN_WIDTH || y >= SKIN_HEIGHT) return null;
  return { x, y };
}

/** Moves a keyboard-inspected texel, clamped to the texture. */
export function moveTexel(texel: Texel | null, dx: number, dy: number): Texel {
  const base = texel ?? { x: 0, y: 0 };
  return {
    x: Math.max(0, Math.min(SKIN_WIDTH - 1, base.x + dx)),
    y: Math.max(0, Math.min(SKIN_HEIGHT - 1, base.y + dy)),
  };
}

export interface ViewFilter {
  readonly model: SkinModel;
  readonly showInner: boolean;
  readonly showOuter: boolean;
}

/**
 * Copy of the skin's RGBA bytes with hidden skin layers made transparent.
 * The source buffer is never modified.
 */
export function visiblePixels(
  skin: PixelBuffer,
  { model, showInner, showOuter }: ViewFilter,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(skin.data);
  if (showInner && showOuter) return out;
  for (let y = 0; y < skin.height; y++) {
    for (let x = 0; x < skin.width; x++) {
      const layer: SkinLayer | undefined = regionAt(x, y, model)?.layer;
      const hidden = (layer === 'inner' && !showInner) || (layer === 'outer' && !showOuter);
      if (hidden) out[(y * skin.width + x) * 4 + 3] = 0;
    }
  }
  return out;
}

/** Whether a texel should be dimmed: unused by the model, or outside the focused part. */
export function isDimmed(x: number, y: number, model: SkinModel, focus: BodyPart | 'all'): boolean {
  const region = regionAt(x, y, model);
  if (!region) return true;
  return focus !== 'all' && region.part !== focus;
}

export function isBodyPart(value: unknown): value is BodyPart {
  return typeof value === 'string' && (BODY_PARTS as readonly string[]).includes(value);
}

/** Pure helpers for the 2D texture view (unit-tested). */
import {
  BODY_PARTS,
  SKIN_HEIGHT,
  SKIN_WIDTH,
  regionMask,
  type BodyPart,
  type PixelBuffer,
  type SkinLayer,
  type SkinMask,
  type SkinModel,
} from '@/engine';

export const MIN_ZOOM = 2;
export const MAX_ZOOM = 24;

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(zoom)));
}

/**
 * Pinch zoom: scales the zoom the gesture started at by how far the fingers
 * have spread (or closed), rounded to a whole zoom step and clamped.
 */
export function pinchZoom(startZoom: number, startDistance: number, distance: number): number {
  if (startDistance <= 0 || distance <= 0) return clampZoom(startZoom);
  return clampZoom((startZoom * distance) / startDistance);
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

/**
 * Like `screenToTexel` but without clamping: strokes keep tracking the
 * pointer outside the texture (tools ignore texels outside it).
 */
export function screenToTexelUnclamped(px: number, py: number, zoom: number): Texel {
  return { x: Math.floor(px / zoom), y: Math.floor(py / zoom) };
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

const layerMasks = new Map<string, SkinMask>();

function layerMask(model: SkinModel, layer: SkinLayer): SkinMask {
  const key = `${model}:${layer}`;
  let mask = layerMasks.get(key);
  if (!mask) {
    mask = regionMask(model, { layers: [layer] });
    layerMasks.set(key, mask);
  }
  return mask;
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
  const hidden: SkinLayer[] = [];
  if (!showInner) hidden.push('inner');
  if (!showOuter) hidden.push('outer');
  for (const layer of hidden) {
    const mask = layerMask(model, layer);
    for (let i = 0; i < mask.bits.length; i++) if (mask.bits[i] === 1) out[i * 4 + 3] = 0;
  }
  return out;
}

export function isBodyPart(value: unknown): value is BodyPart {
  return typeof value === 'string' && (BODY_PARTS as readonly string[]).includes(value);
}

/** Below this zoom, face labels are not drawn: they could not be read. */
export const MIN_LABEL_ZOOM = 6;

/** Label font size (CSS px) for a zoom level: grows with zoom, 9–13 px. */
export function labelFontSize(zoom: number): number {
  return Math.min(13, Math.max(9, Math.round(zoom * 1.1)));
}

/**
 * The first candidate (longest first) that fits a face of `width` × `height`
 * CSS px with a little padding, or `null` when none fits.
 */
export function fitLabel(
  candidates: readonly string[],
  width: number,
  height: number,
  fontSize: number,
  measure: (text: string) => number,
): string | null {
  if (height < fontSize + 2) return null;
  return candidates.find((text) => text !== '' && measure(text) <= width - 4) ?? null;
}

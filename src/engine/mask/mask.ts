/**
 * 64×64 pixel masks over texture space (ARCHITECTURE §4.1): where tools may
 * write. One byte per pixel (1 = included), row-major.
 */
import { allFaceRegions } from '../format/regions';
import {
  SKIN_HEIGHT,
  SKIN_WIDTH,
  type BodyPart,
  type SkinLayer,
  type SkinModel,
} from '../model/types';

export interface SkinMask {
  readonly width: number;
  readonly height: number;
  /** 1 = included, 0 = excluded; index `y * width + x`. */
  readonly bits: Uint8Array;
}

export function createMask(fill = false): SkinMask {
  const bits = new Uint8Array(SKIN_WIDTH * SKIN_HEIGHT);
  if (fill) bits.fill(1);
  return { width: SKIN_WIDTH, height: SKIN_HEIGHT, bits };
}

export function maskHas(mask: SkinMask, x: number, y: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  return mask.bits[y * mask.width + x] === 1;
}

export function maskCount(mask: SkinMask): number {
  let n = 0;
  for (const bit of mask.bits) n += bit;
  return n;
}

export interface RegionFilter {
  /** Body parts to include; all when omitted. */
  readonly parts?: Iterable<BodyPart>;
  /** Skin layers to include; both when omitted. */
  readonly layers?: Iterable<SkinLayer>;
}

/** The face regions of `model` that match the filter. Unused pixels are never included. */
export function regionMask(model: SkinModel, filter: RegionFilter = {}): SkinMask {
  const parts = filter.parts ? new Set(filter.parts) : null;
  const layers = filter.layers ? new Set(filter.layers) : null;
  const mask = createMask();
  for (const { part, layer, rect } of allFaceRegions(model)) {
    if (parts && !parts.has(part)) continue;
    if (layers && !layers.has(layer)) continue;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      mask.bits.fill(1, y * SKIN_WIDTH + rect.x, y * SKIN_WIDTH + rect.x + rect.w);
    }
  }
  return mask;
}

/**
 * Where editing tools may write: the selected body part (or all parts) on
 * the editable skin layers. Unused texture areas are never editable.
 */
export function editMask(
  model: SkinModel,
  part: BodyPart | 'all',
  layers: readonly SkinLayer[],
): SkinMask {
  return regionMask(model, { ...(part === 'all' ? {} : { parts: [part] }), layers });
}

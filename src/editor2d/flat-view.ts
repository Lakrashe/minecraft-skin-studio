/**
 * Flat front/back character views composed from the skin's faces (pure).
 * Used for thumbnails and as the no-WebGL fallback of the 3D preview.
 */
import {
  createPixelBuffer,
  faceRect,
  getPixel,
  setPixel,
  type BodyPart,
  type Face,
  type PixelBuffer,
  type SkinLayer,
  type SkinModel,
} from '@/engine';

export const FLAT_VIEW_WIDTH = 16;
export const FLAT_VIEW_HEIGHT = 32;

export type FlatSide = 'front' | 'back';

/** Alpha-composites `src` over `dst` (straight alpha). */
function blendInto(
  dst: PixelBuffer,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number,
) {
  if (a === 0) return;
  const under = getPixel(dst, x, y);
  if (!under || a === 255 || under.a === 0) {
    setPixel(dst, x, y, { r, g, b, a });
    return;
  }
  const sa = a / 255;
  const da = under.a / 255;
  const oa = sa + da * (1 - sa);
  const mix = (s: number, d: number) => Math.round((s * sa + d * da * (1 - sa)) / oa);
  setPixel(dst, x, y, {
    r: mix(r, under.r),
    g: mix(g, under.g),
    b: mix(b, under.b),
    a: Math.round(oa * 255),
  });
}

function copyFace(
  dst: PixelBuffer,
  skin: PixelBuffer,
  part: BodyPart,
  layer: SkinLayer,
  face: Face,
  model: SkinModel,
  dx: number,
  dy: number,
) {
  const rect = faceRect(part, layer, face, model);
  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const p = getPixel(skin, rect.x + x, rect.y + y);
      if (p) blendInto(dst, dx + x, dy + y, p.r, p.g, p.b, p.a);
    }
  }
}

/**
 * 16×32 view of the character as seen from the front or back, inner layer
 * with the outer layer composited on top. From the front, the player's right
 * arm and leg appear on the viewer's left.
 */
export function composeFlatView(skin: PixelBuffer, model: SkinModel, side: FlatSide): PixelBuffer {
  const out = createPixelBuffer(FLAT_VIEW_WIDTH, FLAT_VIEW_HEIGHT);
  const armW = model === 'slim' ? 3 : 4;
  const [viewerLeftArm, viewerRightArm, viewerLeftLeg, viewerRightLeg] =
    side === 'front'
      ? (['rightArm', 'leftArm', 'rightLeg', 'leftLeg'] as const)
      : (['leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as const);

  const placements: readonly (readonly [BodyPart, number, number])[] = [
    ['head', 4, 0],
    ['body', 4, 8],
    [viewerLeftArm, 4 - armW, 8],
    [viewerRightArm, 12, 8],
    [viewerLeftLeg, 4, 20],
    [viewerRightLeg, 8, 20],
  ];
  for (const layer of ['inner', 'outer'] as const) {
    for (const [part, x, y] of placements) copyFace(out, skin, part, layer, side, model, x, y);
  }
  return out;
}

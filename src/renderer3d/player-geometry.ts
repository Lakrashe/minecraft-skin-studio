/**
 * Pure geometry math for the player model (no Three.js), so it can be unit
 * tested. Units: 1 texture pixel = 1 model unit; feet at y = 0, player faces +z.
 * See docs/MINECRAFT_SKIN_FORMAT.md §9.
 */
import {
  BODY_PARTS,
  SKIN_HEIGHT,
  SKIN_WIDTH,
  partFaces,
  partSize,
  type BodyPart,
  type Face,
  type Rect,
  type SkinLayer,
  type SkinModel,
} from '@/engine';

type Vec3 = readonly [number, number, number];

export interface PartLayout {
  readonly part: BodyPart;
  /** Joint the part rotates around (neck, shoulder, hip …). */
  readonly pivot: Vec3;
  /** Box center relative to the pivot. */
  readonly offset: Vec3;
  /** Inner box size (w, h, d). */
  readonly size: Vec3;
  /** Extra size per side for the outer layer shell. */
  readonly outerInflate: number;
}

/** Joint positions and box offsets per part. The player's right side is −x. */
export function playerLayout(model: SkinModel): readonly PartLayout[] {
  return BODY_PARTS.map((part): PartLayout => {
    const { w, h, d } = partSize(part, model);
    const size: Vec3 = [w, h, d];
    switch (part) {
      case 'head':
        return { part, pivot: [0, 24, 0], offset: [0, 4, 0], size, outerInflate: 0.5 };
      case 'body':
        return { part, pivot: [0, 24, 0], offset: [0, -6, 0], size, outerInflate: 0.25 };
      case 'rightArm':
        // Shoulder at x = −5; the arm's outer edge stays at x = −4 − w.
        return {
          part,
          pivot: [-5, 22, 0],
          offset: [-(w / 2 - 1), -4, 0],
          size,
          outerInflate: 0.25,
        };
      case 'leftArm':
        return { part, pivot: [5, 22, 0], offset: [w / 2 - 1, -4, 0], size, outerInflate: 0.25 };
      case 'rightLeg':
        return { part, pivot: [-2, 12, 0], offset: [0, -6, 0], size, outerInflate: 0.25 };
      case 'leftLeg':
        return { part, pivot: [2, 12, 0], offset: [0, -6, 0], size, outerInflate: 0.25 };
    }
  });
}

/**
 * Three.js BoxGeometry face order is +x, −x, +y, −y, +z, −z. The player faces
 * +z and their right side is −x, so the UV net's `right` face maps to −x and
 * its `left` face to +x.
 */
export const BOX_FACE_ORDER: readonly Face[] = ['left', 'right', 'top', 'bottom', 'front', 'back'];

/**
 * UVs for one BoxGeometry, in its vertex order (per face: top-left, top-right,
 * bottom-left, bottom-right as seen from outside). Texture row 0 is v = 0
 * (DataTexture, flipY = false). The bottom face is flipped vertically, matching
 * how Minecraft maps it.
 */
export function boxUvs(
  faces: Readonly<Record<Face, Rect>>,
  textureWidth = SKIN_WIDTH,
  textureHeight = SKIN_HEIGHT,
): Float32Array {
  const uvs: number[] = [];
  for (const face of BOX_FACE_ORDER) {
    const r = faces[face];
    const x1 = r.x / textureWidth;
    const x2 = (r.x + r.w) / textureWidth;
    const y1 = r.y / textureHeight;
    const y2 = (r.y + r.h) / textureHeight;
    if (face === 'bottom') uvs.push(x1, y2, x2, y2, x1, y1, x2, y1);
    else uvs.push(x1, y1, x2, y1, x1, y2, x2, y2);
  }
  return new Float32Array(uvs);
}

export function partUvs(part: BodyPart, layer: SkinLayer, model: SkinModel): Float32Array {
  return boxUvs(partFaces(part, layer, model));
}

/**
 * Skin engine — pure TypeScript, no React/DOM/Three.js (PROJECT_RULES §1.1).
 * See docs/ARCHITECTURE.md §3–4.
 */
export {
  BODY_PARTS,
  FACES,
  SKIN_HEIGHT,
  SKIN_LAYERS,
  SKIN_MODELS,
  SKIN_WIDTH,
  type BodyPart,
  type Face,
  type Rect,
  type Rgba,
  type SkinLayer,
  type SkinModel,
} from './model/types';
export {
  TRANSPARENT,
  clonePixelBuffer,
  createPixelBuffer,
  fillRect,
  getPixel,
  inBounds,
  setPixel,
  type PixelBuffer,
} from './model/pixel-buffer';
export {
  allFaceRegions,
  cuboidFaces,
  faceRect,
  partFaces,
  partSize,
  rectContains,
  regionAt,
  type BoxSize,
  type FaceRegion,
} from './format/regions';

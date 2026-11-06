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
export {
  createMask,
  editMask,
  maskCount,
  maskHas,
  regionMask,
  type RegionFilter,
  type SkinMask,
} from './mask/mask';
export { MIRROR_PART, mirrorFacePosition, mirrorMap, mirrorPoint } from './symmetry/mirror';
export { floodFillIndices, linePoints, rectPoints, type Point } from './raster/shapes';
export {
  applyCommand,
  blankDocument,
  createDocument,
  createPatch,
  invertCommand,
  withChanges,
  type Command,
  type PixelChanges,
  type PixelPatch,
  type SkinDocument,
} from './document/document';
export {
  DocumentStore,
  commandMatches,
  type DocumentStoreOptions,
  type StoreSnapshot,
} from './document/store';
export {
  DRAWING_TOOLS,
  Stroke,
  pickColor,
  type DrawingTool,
  type ToolOptions,
} from './tools/tools';

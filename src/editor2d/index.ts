/**
 * Canvas 2D skin views and (later) the editor. Must never import renderer3d/
 * (PROJECT_RULES §1.2). See docs/ARCHITECTURE.md §5.
 */
export { FlatPreview, type FlatPreviewProps } from './FlatPreview';
export { TextureView, type TextureViewProps } from './TextureView';
export { composeFlatView, type FlatSide } from './flat-view';
export {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  fitZoom,
  isBodyPart,
  type Texel,
} from './texture-view-math';

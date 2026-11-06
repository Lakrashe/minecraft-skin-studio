/**
 * Canvas 2D skin views and (later) the editor. Must never import renderer3d/
 * (PROJECT_RULES §1.2). See docs/ARCHITECTURE.md §5.
 */
export { FlatPreview, type FlatPreviewProps } from './FlatPreview';
export { TextureView, type TextureViewProps } from './TextureView';
export { composeFlatView, type FlatSide, type FlatViewFilter } from './flat-view';
export {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  fitLabel,
  fitZoom,
  labelFontSize,
  MIN_LABEL_ZOOM,
  pinchZoom,
  isBodyPart,
  type Texel,
} from './texture-view-math';

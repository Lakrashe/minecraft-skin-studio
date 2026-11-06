/**
 * 3D renderer (React Three Fiber + Three.js). Must never import editor2d/
 * (PROJECT_RULES §1.2). See docs/ARCHITECTURE.md §6.
 *
 * This index must not statically import three or @react-three/* so that
 * pages without 3D never download the 3D bundle (vite.config.ts → `three` chunk).
 */
import { lazy } from 'react';

export const LazySceneCanvas = lazy(() => import('./SceneCanvas'));
export const LazyPlayerViewer = lazy(() => import('./PlayerViewer'));
export type { SceneCanvasProps } from './SceneCanvas';
export type { PlayerViewerProps } from './PlayerViewer';
// Pure modules only (no three): the rest of core/ loads with the lazy viewer.
export { CAMERA_VIEWS, type CameraView } from './core/camera-views';
export { viewerFrameLoop, type FrameLoop } from './core/frame-loop';
export {
  DEFAULT_LIGHTING,
  LIGHTING_PRESETS,
  MAX_LIGHT_INTENSITY,
  MIN_LIGHT_INTENSITY,
  clampLightIntensity,
  isLightingPreset,
  type LightingPreset,
} from './core/lighting';
export { isWebGLAvailable } from './webgl';

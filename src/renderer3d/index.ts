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
export { CAMERA_VIEWS, type CameraView } from './camera-views';
export { isWebGLAvailable } from './webgl';

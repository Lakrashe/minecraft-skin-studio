/**
 * Rendering core: plain Three.js and pure data, no React and no DOM. The React
 * layer (`../PlayerModel`, `../PlayerViewer`) only binds it to a canvas and to
 * component props, so the core can be tested in Node and reused by any UI.
 */
export { CAMERA_VIEWS, PLAYER_CENTER, cameraPosition, type CameraView } from './camera-views';
export { viewerFrameLoop, type FrameLoop } from './frame-loop';
export {
  DEFAULT_LIGHTING,
  LIGHTING_PRESETS,
  MAX_LIGHT_INTENSITY,
  MIN_LIGHT_INTENSITY,
  clampLightIntensity,
  isLightingPreset,
  lightingRig,
  type LightSpec,
  type LightingPreset,
  type LightingRig,
} from './lighting';
export {
  BOX_FACE_ORDER,
  HIP_X,
  boxUvs,
  partUvs,
  playerLayout,
  shoulderY,
  type PartLayout,
} from './player-geometry';
export { connectSkinSource, isSkinSource, staticSkinSource, type SkinSource } from './skin-source';
export {
  OUTER_ALPHA_CUTOFF,
  PlayerRig,
  partGeometry,
  type RigMesh,
  type RigVisibility,
} from './player-rig';

import { create } from 'zustand';
import type { SampleId } from '@/content';
import { clampZoom, type Texel } from '@/editor2d';
import type { BodyPart, DrawingTool, Rgba, SkinLayer } from '@/engine';
import type { CameraView } from '@/renderer3d';
import type { AnimationId } from '@/rig';
import { INITIAL_SAMPLE } from './document';

/** Every tool in the toolbar: the engine's drawing tools plus eyedropper and pan. */
export const TOOLS = ['pencil', 'eraser', 'bucket', 'eyedropper', 'line', 'rect', 'pan'] as const;
export type ToolId = (typeof TOOLS)[number];

export function isDrawingTool(tool: ToolId): tool is DrawingTool {
  return tool !== 'eyedropper' && tool !== 'pan';
}

export type EditLayer = 'both' | SkinLayer;

/**
 * Studio UI state (PROJECT_RULES §1.7): tools, color, view options. The skin
 * pixels live in the document store (`document.ts`), never here.
 */
export interface StudioState {
  /** Last loaded starting point, shown in the "Start from" picker. */
  readonly source: SampleId | 'blank';
  readonly tool: ToolId;
  readonly color: Rgba;
  readonly mirror: boolean;
  readonly rectFilled: boolean;
  readonly editLayer: EditLayer;
  readonly showInner: boolean;
  readonly showOuter: boolean;
  readonly grid: boolean;
  readonly outlines: boolean;
  readonly labels: boolean;
  /** The body part tools paint (and the 3D view isolates). */
  readonly focus: BodyPart | 'all';
  readonly zoom: number;
  /** While true the texture keeps fitting the workspace; a manual zoom turns it off. */
  readonly autoFit: boolean;
  /** Incremented to ask the workspace to fit the texture now. */
  readonly fitRequest: number;
  readonly inspected: Texel | null;
  /**
   * The animation the user picked, or `null` for the default: idle, or off
   * when reduced motion is requested (see `effectiveAnimation`).
   */
  readonly animation: AnimationId | null;
  readonly paused: boolean;
  readonly view: CameraView;
  /** Incremented to re-apply the same camera preset. */
  readonly viewRequest: number;

  setSource: (source: SampleId | 'blank') => void;
  setTool: (tool: ToolId) => void;
  setColor: (color: Rgba) => void;
  setMirror: (mirror: boolean) => void;
  setRectFilled: (filled: boolean) => void;
  setEditLayer: (layer: EditLayer) => void;
  setShowInner: (show: boolean) => void;
  setShowOuter: (show: boolean) => void;
  setGrid: (grid: boolean) => void;
  setOutlines: (outlines: boolean) => void;
  setLabels: (labels: boolean) => void;
  setFocus: (focus: BodyPart | 'all') => void;
  /** Sets the zoom without changing auto-fit (used by fitting itself). */
  setZoom: (zoom: number) => void;
  /** A manual zoom: clamps and stops auto-fitting. */
  zoomTo: (zoom: number) => void;
  requestFit: () => void;
  setInspected: (texel: Texel | null) => void;
  setAnimation: (animation: AnimationId) => void;
  togglePaused: () => void;
  showView: (view: CameraView) => void;
}

export const INITIAL_COLOR: Rgba = { r: 63, g: 163, b: 77, a: 255 };

function sameTexel(a: Texel | null, b: Texel | null): boolean {
  return a === b || (a !== null && b !== null && a.x === b.x && a.y === b.y);
}

/**
 * The animation to play: the user's explicit choice, otherwise idle — or off
 * when reduced motion is requested. Choosing an animation is a deliberate
 * action, so it is honored even under reduced motion.
 */
export function effectiveAnimation(
  chosen: AnimationId | null,
  reducedMotion: boolean,
): AnimationId {
  return chosen ?? (reducedMotion ? 'none' : 'idle');
}

/** Skin layers tools may paint: the chosen ones, minus hidden layers. */
export function editableLayers(
  editLayer: EditLayer,
  showInner: boolean,
  showOuter: boolean,
): SkinLayer[] {
  const layers: SkinLayer[] = [];
  if ((editLayer === 'both' || editLayer === 'inner') && showInner) layers.push('inner');
  if ((editLayer === 'both' || editLayer === 'outer') && showOuter) layers.push('outer');
  return layers;
}

export const useStudio = create<StudioState>()((set) => ({
  source: INITIAL_SAMPLE,
  tool: 'pencil',
  color: INITIAL_COLOR,
  mirror: false,
  rectFilled: false,
  editLayer: 'both',
  showInner: true,
  showOuter: true,
  grid: true,
  outlines: true,
  labels: false,
  focus: 'all',
  zoom: 8,
  autoFit: true,
  fitRequest: 0,
  inspected: null,
  animation: null,
  paused: false,
  view: 'reset',
  viewRequest: 0,

  setSource: (source) => {
    set({ source, inspected: null });
  },
  setTool: (tool) => {
    set({ tool });
  },
  setColor: (color) => {
    set({ color });
  },
  setMirror: (mirror) => {
    set({ mirror });
  },
  setRectFilled: (rectFilled) => {
    set({ rectFilled });
  },
  setEditLayer: (editLayer) => {
    set({ editLayer });
  },
  setShowInner: (showInner) => {
    set({ showInner });
  },
  setShowOuter: (showOuter) => {
    set({ showOuter });
  },
  setGrid: (grid) => {
    set({ grid });
  },
  setOutlines: (outlines) => {
    set({ outlines });
  },
  setLabels: (labels) => {
    set({ labels });
  },
  setFocus: (focus) => {
    set({ focus });
  },
  setZoom: (zoom) => {
    set({ zoom });
  },
  zoomTo: (zoom) => {
    set({ zoom: clampZoom(zoom), autoFit: false });
  },
  requestFit: () => {
    set((s) => ({ autoFit: true, fitRequest: s.fitRequest + 1 }));
  },
  // Pointer moves within one texel must not notify subscribers or redraw.
  setInspected: (inspected) => {
    set((s) => (sameTexel(s.inspected, inspected) ? s : { inspected }));
  },
  setAnimation: (animation) => {
    set({ animation, paused: false });
  },
  togglePaused: () => {
    set((s) => ({ paused: !s.paused }));
  },
  showView: (view) => {
    set((s) => ({ view, viewRequest: s.viewRequest + 1 }));
  },
}));

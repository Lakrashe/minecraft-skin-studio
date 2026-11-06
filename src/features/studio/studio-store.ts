import { create } from 'zustand';
import { getSample, type SampleId } from '@/content';
import type { Texel } from '@/editor2d';
import type { BodyPart, SkinModel } from '@/engine';
import type { CameraView } from '@/renderer3d';
import type { AnimationId } from '@/rig';

/**
 * Studio view state (UI only — PROJECT_RULES §1.7). The skin pixels come from
 * the selected sample; this store never holds pixel data.
 */
export interface StudioState {
  readonly sampleId: SampleId;
  readonly model: SkinModel;
  readonly showInner: boolean;
  readonly showOuter: boolean;
  readonly grid: boolean;
  readonly outlines: boolean;
  readonly focus: BodyPart | 'all';
  readonly zoom: number;
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

  selectSample: (id: SampleId) => void;
  setModel: (model: SkinModel) => void;
  setShowInner: (show: boolean) => void;
  setShowOuter: (show: boolean) => void;
  setGrid: (grid: boolean) => void;
  setOutlines: (outlines: boolean) => void;
  setFocus: (focus: BodyPart | 'all') => void;
  setZoom: (zoom: number) => void;
  setInspected: (texel: Texel | null) => void;
  setAnimation: (animation: AnimationId) => void;
  togglePaused: () => void;
  showView: (view: CameraView) => void;
}

const INITIAL_SAMPLE: SampleId = 'explorer';

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

export const useStudio = create<StudioState>()((set) => ({
  sampleId: INITIAL_SAMPLE,
  model: getSample(INITIAL_SAMPLE).model,
  showInner: true,
  showOuter: true,
  grid: true,
  outlines: true,
  focus: 'all',
  zoom: 8,
  inspected: null,
  animation: null,
  paused: false,
  view: 'reset',
  viewRequest: 0,

  // Switching character also switches to the model the skin was designed for.
  selectSample: (id) => {
    set({ sampleId: id, model: getSample(id).model, inspected: null });
  },
  setModel: (model) => {
    set({ model, inspected: null });
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
  setFocus: (focus) => {
    set({ focus });
  },
  setZoom: (zoom) => {
    set({ zoom });
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

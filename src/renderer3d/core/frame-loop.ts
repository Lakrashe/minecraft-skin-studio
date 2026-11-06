import type { AnimationId } from '@/rig';

/**
 * - `always`: render every animation frame (something is moving).
 * - `demand`: render only when invalidated (static scene, interaction, prop change).
 * - `never`: render nothing (offscreen or hidden view).
 */
export type FrameLoop = 'always' | 'demand' | 'never';

/**
 * Chooses the cheapest frame loop for a player view: nothing while inactive,
 * continuous only while something moves, otherwise on demand.
 */
export function viewerFrameLoop(options: {
  readonly active: boolean;
  readonly autoRotate: boolean;
  readonly animation: AnimationId;
  readonly paused: boolean;
}): FrameLoop {
  if (!options.active) return 'never';
  const animating = options.animation !== 'none' && !options.paused;
  return options.autoRotate || animating ? 'always' : 'demand';
}

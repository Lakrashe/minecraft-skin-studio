/**
 * Poses and animation clips as pure data (docs/ARCHITECTURE.md §7).
 * Angles are radians, applied at each part's pivot (neck, shoulders, hips).
 */

export type RigPart = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';
export const RIG_PARTS: readonly RigPart[] = [
  'head',
  'body',
  'rightArm',
  'leftArm',
  'rightLeg',
  'leftLeg',
];

export interface Rotation {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type Pose = Readonly<Record<RigPart, Rotation>>;

const ZERO: Rotation = { x: 0, y: 0, z: 0 };

export const NEUTRAL_POSE: Pose = {
  head: ZERO,
  body: ZERO,
  rightArm: ZERO,
  leftArm: ZERO,
  rightLeg: ZERO,
  leftLeg: ZERO,
};

export const ANIMATIONS = ['idle', 'walk', 'none'] as const;
export type AnimationId = (typeof ANIMATIONS)[number];

export function isAnimationId(value: unknown): value is AnimationId {
  return typeof value === 'string' && (ANIMATIONS as readonly string[]).includes(value);
}

/** Gentle breathing sway with a slow look-around. */
function idle(t: number): Pose {
  const sway = Math.sin(t * 1.4) * 0.05;
  const lift = Math.sin(t * 1.4 + 1) * 0.03;
  return {
    head: { x: Math.sin(t * 0.7) * 0.04, y: Math.sin(t * 0.45) * 0.25, z: 0 },
    body: ZERO,
    rightArm: { x: lift, y: 0, z: -0.06 - sway },
    leftArm: { x: -lift, y: 0, z: 0.06 + sway },
    rightLeg: ZERO,
    leftLeg: ZERO,
  };
}

/** Walk cycle: opposite arm and leg swing, like the game's walking animation. */
function walk(t: number): Pose {
  const swing = Math.sin(t * 5.5);
  return {
    head: { x: 0, y: Math.sin(t * 2.75) * 0.06, z: 0 },
    body: ZERO,
    rightArm: { x: swing * 0.6, y: 0, z: -0.04 },
    leftArm: { x: -swing * 0.6, y: 0, z: 0.04 },
    rightLeg: { x: -swing * 0.7, y: 0, z: 0 },
    leftLeg: { x: swing * 0.7, y: 0, z: 0 },
  };
}

/** Pose of an animation at time `t` (seconds). */
export function sampleAnimation(id: AnimationId, t: number): Pose {
  switch (id) {
    case 'idle':
      return idle(t);
    case 'walk':
      return walk(t);
    case 'none':
      return NEUTRAL_POSE;
  }
}

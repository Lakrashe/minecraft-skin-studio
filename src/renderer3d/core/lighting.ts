/**
 * Lighting presets as data (ARCHITECTURE §6). The React layer turns a rig into
 * Three.js lights; `flat` renders the skin unlit so every pixel shows its exact
 * color (useful for checking a skin, and for tests).
 */

export const LIGHTING_PRESETS = [
  'studio',
  'daylight',
  'sunset',
  'neon',
  'cinematic',
  'flat',
] as const;
export type LightingPreset = (typeof LIGHTING_PRESETS)[number];

export const DEFAULT_LIGHTING: LightingPreset = 'studio';

export type LightSpec =
  | { readonly kind: 'ambient'; readonly color: string; readonly intensity: number }
  | {
      readonly kind: 'hemisphere';
      readonly color: string;
      readonly groundColor: string;
      readonly intensity: number;
    }
  | {
      readonly kind: 'directional';
      readonly color: string;
      readonly intensity: number;
      /** Light position; it shines toward the player's center. */
      readonly position: readonly [number, number, number];
    };

export interface LightingRig {
  readonly preset: LightingPreset;
  /** Unlit: materials ignore lights and show texture colors exactly. */
  readonly unlit: boolean;
  readonly lights: readonly LightSpec[];
}

/** Intensity multiplier limits for the "Light intensity" control. */
export const MIN_LIGHT_INTENSITY = 0.25;
export const MAX_LIGHT_INTENSITY = 2;

const PRESETS: Readonly<Record<LightingPreset, Omit<LightingRig, 'preset'>>> = {
  studio: {
    unlit: false,
    lights: [
      { kind: 'ambient', color: '#ffffff', intensity: 1.4 },
      { kind: 'directional', color: '#ffffff', intensity: 1.7, position: [30, 50, 40] },
      { kind: 'directional', color: '#ffffff', intensity: 0.6, position: [-35, 20, -40] },
    ],
  },
  daylight: {
    unlit: false,
    lights: [
      { kind: 'hemisphere', color: '#cfe6ff', groundColor: '#6b5a3a', intensity: 1.8 },
      { kind: 'directional', color: '#fff1d6', intensity: 2.2, position: [40, 80, 30] },
    ],
  },
  sunset: {
    unlit: false,
    lights: [
      { kind: 'ambient', color: '#4a3a6a', intensity: 0.9 },
      { kind: 'directional', color: '#ff9a4d', intensity: 2.6, position: [-60, 25, 30] },
      { kind: 'directional', color: '#7b6cff', intensity: 1.4, position: [40, 30, -50] },
    ],
  },
  neon: {
    unlit: false,
    lights: [
      { kind: 'ambient', color: '#1a1030', intensity: 0.7 },
      { kind: 'directional', color: '#22e6ff', intensity: 2.6, position: [-40, 30, 30] },
      { kind: 'directional', color: '#ff3df2', intensity: 2.6, position: [40, 30, 30] },
      { kind: 'directional', color: '#6b5bff', intensity: 1.2, position: [0, 40, -50] },
    ],
  },
  cinematic: {
    unlit: false,
    lights: [
      { kind: 'ambient', color: '#ffffff', intensity: 0.35 },
      { kind: 'directional', color: '#fff4e0', intensity: 3, position: [35, 45, 45] },
      { kind: 'directional', color: '#9fc7ff', intensity: 2, position: [-30, 40, -45] },
    ],
  },
  flat: { unlit: true, lights: [] },
};

export function isLightingPreset(value: unknown): value is LightingPreset {
  return typeof value === 'string' && (LIGHTING_PRESETS as readonly string[]).includes(value);
}

export function clampLightIntensity(intensity: number): number {
  if (!Number.isFinite(intensity)) return 1;
  return Math.min(MAX_LIGHT_INTENSITY, Math.max(MIN_LIGHT_INTENSITY, intensity));
}

/** The lights for a preset, every intensity scaled by `intensity` (clamped). */
export function lightingRig(preset: LightingPreset, intensity = 1): LightingRig {
  const k = clampLightIntensity(intensity);
  const base = PRESETS[preset];
  return {
    preset,
    unlit: base.unlit,
    lights: base.lights.map((light) => ({ ...light, intensity: light.intensity * k })),
  };
}

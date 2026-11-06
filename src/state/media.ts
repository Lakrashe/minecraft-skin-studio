import { useSyncExternalStore } from 'react';
import type { MotionPreference } from './settings';
import { useSettings } from './settings';

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  };
}

/** Live value of a CSS media query (false during server rendering). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export type ResolvedMotion = 'full' | 'reduced';

export function resolveMotion(
  preference: MotionPreference,
  systemPrefersReduced: boolean,
): ResolvedMotion {
  if (preference === 'system') return systemPrefersReduced ? 'reduced' : 'full';
  return preference;
}

/**
 * True when motion should be reduced: the saved setting, or the OS preference
 * when the setting is "Follow system". Updates live when either changes.
 * JavaScript animation (e.g. the 3D views) must consult this — CSS
 * `prefers-reduced-motion` rules cannot stop it (PROJECT_RULES §1.11).
 */
export function useReducedMotion(): boolean {
  const preference = useSettings((s) => s.motion);
  const systemPrefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  return resolveMotion(preference, systemPrefersReduced) === 'reduced';
}

import { useSyncExternalStore } from 'react';
import type { MotionPreference, ThemePreference } from '@/state';

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  };
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function resolveTheme(preference: ThemePreference, systemPrefersLight: boolean) {
  if (preference === 'system') return systemPrefersLight ? 'light' : 'dark';
  return preference;
}

export function resolveMotion(preference: MotionPreference, systemPrefersReduced: boolean) {
  if (preference === 'system') return systemPrefersReduced ? 'reduced' : 'full';
  return preference;
}

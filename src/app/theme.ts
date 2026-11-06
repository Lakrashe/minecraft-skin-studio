import type { ThemePreference } from '@/state';

export { resolveMotion, useMediaQuery } from '@/state';

export function resolveTheme(preference: ThemePreference, systemPrefersLight: boolean) {
  if (preference === 'system') return systemPrefersLight ? 'light' : 'dark';
  return preference;
}

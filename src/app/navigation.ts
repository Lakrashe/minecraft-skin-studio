import type { TKey } from '@/i18n';
import type { IconName } from '@/ui';

export interface NavItem {
  readonly to: string;
  readonly labelKey: TKey;
  readonly icon: IconName;
}

/**
 * Primary navigation. Only pages that are fully built appear here
 * (PROJECT_RULES §1.10) — add an entry in the same change that ships a page.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: 'home' },
  { to: '/editor', labelKey: 'nav.studio', icon: 'cube' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'settings' },
];

/** Route metadata read by the shell. */
export interface RouteHandle {
  readonly titleKey: TKey;
  /** App-style page: fills the viewport below the header, no footer (e.g. the Studio). */
  readonly fullHeight?: boolean;
}

export function isRouteHandle(value: unknown): value is RouteHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['titleKey'] === 'string'
  );
}

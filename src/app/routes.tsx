import type { RouteObject } from 'react-router';
import { NotFoundPage } from '@/features/not-found';
import { AppShell, FullPageLoader } from './layout/AppShell';
import type { RouteHandle } from './navigation';
import { RouteError } from './RouteError';

const handle = (titleKey: RouteHandle['titleKey']): RouteHandle => ({ titleKey });

/**
 * Developer-only routes. `import.meta.env.DEV` is a build-time constant, so
 * production builds drop these routes and their chunks entirely.
 */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: 'dev/ui',
        handle: handle('devUi.title'),
        lazy: async () => ({ Component: (await import('@/features/dev-ui')).DevUiPage }),
      },
    ]
  : [];

/**
 * Route table. Feature pages are lazy-loaded so each page ships its own chunk.
 * Add a route together with its NAV_ITEMS entry when a page is fully built.
 */
export function createRoutes(): RouteObject[] {
  return [
    {
      path: '/',
      Component: AppShell,
      errorElement: <RouteError />,
      hydrateFallbackElement: <FullPageLoader />,
      children: [
        {
          index: true,
          handle: handle('home.title'),
          lazy: async () => ({ Component: (await import('@/features/home')).HomePage }),
        },
        {
          path: 'editor',
          handle: { titleKey: 'studio.title', fullHeight: true } satisfies RouteHandle,
          lazy: async () => ({ Component: (await import('@/features/studio')).StudioPage }),
        },
        {
          path: 'settings',
          handle: handle('settings.title'),
          lazy: async () => ({ Component: (await import('@/features/settings')).SettingsPage }),
        },
        ...devRoutes,
        { path: '*', handle: handle('notFound.title'), Component: NotFoundPage },
      ],
    },
  ];
}

import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useMatches, useNavigation } from 'react-router';
import { useT } from '@/i18n';
import { cn, PixelLoader } from '@/ui';
import { BRAND } from '../brand';
import { isRouteHandle } from '../navigation';
import { Footer } from './Footer';
import { Header } from './Header';

/** Sets the document title from the deepest route handle and returns that handle. */
function useRouteHandle() {
  const t = useT();
  const matches = useMatches();
  const found = [...matches].reverse().find((m) => isRouteHandle(m.handle))?.handle;
  const handle = isRouteHandle(found) ? found : undefined;
  const titleKey = handle?.titleKey;
  useEffect(() => {
    document.title = titleKey ? `${t(titleKey)} · ${BRAND.name}` : BRAND.name;
  }, [t, titleKey]);
  return handle;
}

/** Thin accent bar shown while a lazy route is loading. */
function RouteProgress() {
  const navigation = useNavigation();
  const loading = navigation.state !== 'idle';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent transition-[transform,opacity] duration-500',
        loading ? 'scale-x-75 opacity-100' : 'scale-x-100 opacity-0',
      )}
    />
  );
}

export function AppShell() {
  const t = useT();
  const fullHeight = useRouteHandle()?.fullHeight === true;
  return (
    <div className={cn('flex min-h-dvh flex-col', fullHeight && 'lg:h-dvh lg:overflow-hidden')}>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-accent-contrast focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('common.skipToContent')}
      </a>
      <RouteProgress />
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className={cn(
          'flex flex-1 flex-col outline-none',
          // App-style pages fill the remaining viewport height on large screens.
          fullHeight && 'lg:min-h-0',
        )}
      >
        <Outlet />
      </main>
      {!fullHeight && <Footer />}
      <ScrollRestoration />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <PixelLoader />
    </div>
  );
}

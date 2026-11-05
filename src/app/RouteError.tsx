import { isRouteErrorResponse, useRouteError } from 'react-router';
import { useT } from '@/i18n';
import { NotFoundPage } from '@/features/not-found';
import { Button, Icon, LogoMark } from '@/ui';

/** Error boundary for the route tree: 404s render the not-found page, anything else a recovery screen. */
export function RouteError() {
  const error = useRouteError();
  const t = useT();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  console.error(error);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <LogoMark size={48} />
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t('error.title')}</h1>
        <p className="mt-2 max-w-md text-muted">{t('error.message')}</p>
      </div>
      <Button
        variant="primary"
        leadingIcon={<Icon name="refresh" size={18} />}
        onClick={() => {
          window.location.reload();
        }}
      >
        {t('error.reload')}
      </Button>
    </div>
  );
}

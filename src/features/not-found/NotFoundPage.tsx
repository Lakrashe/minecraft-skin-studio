import { Link } from 'react-router';
import { useT } from '@/i18n';
import { buttonClasses, Icon } from '@/ui';

export function NotFoundPage() {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="font-mono text-6xl font-bold text-accent" aria-hidden="true">
        404
      </p>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('notFound.title')}
        </h1>
        <p className="mt-2 max-w-md text-muted">{t('notFound.message')}</p>
      </div>
      <Link to="/" className={buttonClasses('primary')}>
        <Icon name="arrowLeft" size={18} />
        {t('notFound.backHome')}
      </Link>
    </div>
  );
}

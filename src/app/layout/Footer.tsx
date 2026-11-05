import { Link } from 'react-router';
import { useT } from '@/i18n';
import { LogoMark } from '@/ui';
import { BRAND } from '../brand';
import { NAV_ITEMS } from '../navigation';

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-line/70 bg-bg-raised">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5 font-display font-semibold">
            <LogoMark size={24} />
            {BRAND.name}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-subtle">{t('footer.notAffiliated')}</p>
        </div>
        <nav aria-label={t('nav.main')}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted transition-colors hover:text-fg">
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line/50">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-subtle sm:px-6">
          {t('footer.rights', { year: new Date().getFullYear(), brand: BRAND.name })}
        </p>
      </div>
    </footer>
  );
}

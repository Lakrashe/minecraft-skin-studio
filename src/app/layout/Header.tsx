import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useT } from '@/i18n';
import { useSettings } from '@/state';
import { cn, Dialog, Icon, IconButton, Logo } from '@/ui';
import { BRAND } from '../brand';
import { NAV_ITEMS } from '../navigation';
import { resolveTheme, useMediaQuery } from '../theme';

function ThemeToggle() {
  const t = useT();
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const systemPrefersLight = useMediaQuery('(prefers-color-scheme: light)');
  const isLight = resolveTheme(theme, systemPrefersLight) === 'light';
  return (
    <IconButton
      icon={isLight ? 'moon' : 'sun'}
      label={isLight ? t('theme.switchToDark') : t('theme.switchToLight')}
      tooltipAlign="end"
      onClick={() => {
        setTheme(isLight ? 'dark' : 'light');
      }}
    />
  );
}

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative rounded-control px-3 py-2 text-sm font-medium transition-colors duration-150',
    isActive ? 'text-fg' : 'text-muted hover:text-fg hover:bg-surface-2',
  );

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-control px-3 py-3 text-base font-medium transition-colors',
    isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg',
  );

export function Header() {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-control" aria-label={`${BRAND.name} — ${t('nav.home')}`}>
          <Logo name={BRAND.name} />
        </Link>

        <nav aria-label={t('nav.main')} className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end className={desktopLink}>
                  {({ isActive }) => (
                    <>
                      {t(item.labelKey)}
                      {isActive && (
                        <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <div className="md:hidden">
            <IconButton
              icon="menu"
              label={t('nav.openMenu')}
              tooltipAlign="end"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={closeMenu} title={t('nav.menu')} variant="sheet">
        <nav aria-label={t('nav.main')}>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end className={mobileLink} onClick={closeMenu}>
                  <Icon name={item.icon} />
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Dialog>
    </header>
  );
}

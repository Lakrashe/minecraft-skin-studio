import { Link } from 'react-router';
import { useT } from '@/i18n';
import { buttonClasses, Icon, type IconName } from '@/ui';
import { Section } from './Section';

const ACCURACY: readonly { key: 'format' | 'models' | 'layers' | 'uv'; icon: IconName }[] = [
  { key: 'format', icon: 'grid' },
  { key: 'models', icon: 'cube' },
  { key: 'layers', icon: 'layers' },
  { key: 'uv', icon: 'target' },
];

export function AccuracySection() {
  const t = useT();
  return (
    <Section title={t('home.accuracy.title')} intro={t('home.accuracy.intro')}>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ACCURACY.map(({ key, icon }) => (
          <li key={key} className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
              <Icon name={icon} size={22} />
            </span>
            <h3 className="mt-4 font-display font-semibold">{t(`home.accuracy.${key}.title`)}</h3>
            <p className="mt-1.5 text-sm text-muted">{t(`home.accuracy.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const FAQ = ['free', 'account', 'editions', 'edit', 'affiliated'] as const;

export function FaqSection() {
  const t = useT();
  return (
    <Section id="faq" title={t('home.faq.title')}>
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {FAQ.map((key) => (
          <details
            key={key}
            className="group rounded-panel border border-line bg-surface px-5 py-4 open:bg-surface-2"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {t(`home.faq.${key}.q`)}
              <Icon
                name="arrowRight"
                size={16}
                className="shrink-0 text-subtle transition-transform duration-200 group-open:rotate-90"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t(`home.faq.${key}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  const t = useT();
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-panel border border-accent/30 bg-surface px-6 py-14 text-center shadow-panel sm:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 65%)',
          }}
        />
        <h2 className="relative font-display text-3xl font-bold tracking-tight text-balance">
          {t('home.finalCta.title')}
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-muted">{t('home.finalCta.body')}</p>
        <Link to="/editor" className={`${buttonClasses('primary', 'lg')} relative mt-8`}>
          {t('home.ctaStudio')}
          <Icon name="arrowRight" size={18} />
        </Link>
      </div>
    </section>
  );
}

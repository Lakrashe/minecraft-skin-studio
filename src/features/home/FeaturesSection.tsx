import { useT, type TKey } from '@/i18n';
import { Badge, Icon, type BadgeTone, type IconName } from '@/ui';
import { Section } from './Section';

type Status = 'available' | 'inProgress' | 'planned';

interface Feature {
  readonly key: 'pixelEditor' | 'preview3d' | 'ai' | 'outfits' | 'showcase' | 'marketplace';
  readonly icon: IconName;
  /** Honest status — update when a feature ships (PROJECT_RULES §1.10). */
  readonly status: Status;
}

const FEATURES: readonly Feature[] = [
  { key: 'pixelEditor', icon: 'pencil', status: 'available' },
  { key: 'preview3d', icon: 'cube', status: 'available' },
  { key: 'ai', icon: 'sparkles', status: 'planned' },
  { key: 'outfits', icon: 'shirt', status: 'planned' },
  { key: 'showcase', icon: 'camera', status: 'planned' },
  { key: 'marketplace', icon: 'store', status: 'planned' },
];

const STATUS_TONE: Readonly<Record<Status, BadgeTone>> = {
  available: 'success',
  inProgress: 'warning',
  planned: 'neutral',
};

export function FeaturesSection() {
  const t = useT();
  return (
    <Section id="features" title={t('home.features.title')} intro={t('home.features.intro')}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ key, icon, status }) => (
          <li
            key={key}
            className="group relative overflow-hidden rounded-panel border border-line bg-surface p-6 shadow-panel transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
            />
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-control bg-accent/12 text-accent">
                <Icon name={icon} size={22} />
              </span>
              <Badge tone={STATUS_TONE[status]}>
                {t(`home.features.status.${status}` satisfies TKey)}
              </Badge>
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
              {t(`home.features.${key}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t(`home.features.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

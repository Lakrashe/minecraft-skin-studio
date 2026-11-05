import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { SAMPLE_CHARACTERS, sampleSkin, type SampleId } from '@/content';
import { FlatPreview } from '@/editor2d';
import { useT } from '@/i18n';
import { Badge, buttonClasses, cn, Icon } from '@/ui';
import { PlayerStage } from './PlayerStage';
import { Section } from './Section';
import { useInView } from './use-in-view';

export function CharactersSection() {
  const t = useT();
  const [selected, setSelected] = useState<SampleId>('knight');
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef);
  const name = t(`samples.${selected}.name`);

  return (
    <Section id="characters" title={t('home.characters.title')} intro={t('home.characters.intro')}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div
          role="group"
          aria-label={t('home.characters.choose')}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
        >
          {SAMPLE_CHARACTERS.map((sample) => {
            const active = sample.id === selected;
            const sampleName = t(`samples.${sample.id}.name`);
            return (
              <button
                key={sample.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelected(sample.id);
                }}
                className={cn(
                  'flex items-center gap-4 rounded-panel border p-3 text-left transition-colors duration-150',
                  active
                    ? 'border-accent/60 bg-accent/10'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                )}
              >
                <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-control bg-bg-raised">
                  <FlatPreview skin={sampleSkin(sample.id)} model={sample.model} height={64} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-semibold">{sampleName}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {t(`samples.${sample.id}.tagline`)}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <Badge>
                      {t(
                        sample.model === 'slim'
                          ? 'home.characters.slim'
                          : 'home.characters.classic',
                      )}
                    </Badge>
                    {sample.usesOuterLayer && <Badge>{t('home.characters.outerLayer')}</Badge>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          ref={stageRef}
          className="relative flex min-h-[420px] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-panel lg:min-h-[520px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 85%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%)',
            }}
          />
          <PlayerStage
            key={selected}
            sampleId={selected}
            active={inView}
            label={t('home.characters.viewerLabel', { name })}
            fallbackHeight={280}
            className="flex-1"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
            <div>
              <p className="font-display font-semibold">{name}</p>
              <p className="text-sm text-muted">{t(`samples.${selected}.tagline`)}</p>
            </div>
            <Link to={`/editor?sample=${selected}`} className={buttonClasses('primary')}>
              {t('home.characters.openInStudio')}
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

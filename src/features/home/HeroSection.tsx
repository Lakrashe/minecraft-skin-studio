import { Link } from 'react-router';
import { useT } from '@/i18n';
import { Badge, buttonClasses, Icon } from '@/ui';
import { PlayerStage } from './PlayerStage';

/** Animated backdrop: soft accent glows drifting over a faint pixel grid. */
function HeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in srgb, var(--accent) 10%, transparent) 1px, transparent 1px),' +
            'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 10%, transparent) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div
        className="absolute -top-1/3 left-1/3 size-[42rem] animate-drift rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) calc(var(--glow-strength) * 100%), transparent) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute -right-40 bottom-0 size-[28rem] animate-drift rounded-full blur-3xl [animation-delay:-9s]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}

export function HeroSection() {
  const t = useT();
  const name = t('samples.explorer.name');
  return (
    <section className="relative isolate overflow-hidden">
      <HeroBackground />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Badge tone="accent" className="animate-slide-up">
            <Icon name="sparkles" size={14} />
            {t('home.eyebrow')}
          </Badge>
          <h1 className="mt-6 max-w-3xl animate-slide-up bg-gradient-to-b from-fg to-fg/70 bg-clip-text font-display text-4xl font-bold tracking-tight text-balance text-transparent [animation-delay:60ms] sm:text-6xl xl:text-7xl">
            {t('home.headline')}
          </h1>
          <p className="mt-6 max-w-xl animate-slide-up text-lg text-pretty text-muted [animation-delay:120ms] sm:text-xl">
            {t('home.subtitle')}
          </p>
          <div className="mt-9 flex animate-slide-up flex-col gap-3 [animation-delay:180ms] sm:flex-row">
            <Link to="/editor" className={buttonClasses('primary', 'lg')}>
              {t('home.ctaStudio')}
              <Icon name="arrowRight" size={18} />
            </Link>
            <a href="#characters" className={buttonClasses('secondary', 'lg')}>
              {t('home.ctaCharacters')}
            </a>
          </div>
        </div>

        <div className="relative mx-auto h-[380px] w-full max-w-md animate-fade-in sm:h-[460px] lg:h-[560px] lg:max-w-none">
          {/* Glow and floor disc under the character. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[15%] bottom-[8%] h-10 rounded-[50%] blur-xl"
            style={{ background: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-[22%] bottom-[9%] h-6 rounded-[50%] border border-accent/30 bg-surface/40"
          />
          <PlayerStage
            sampleId="explorer"
            label={t('home.heroViewerLabel', { name })}
            fallbackHeight={300}
            className="size-full"
          />
          <p className="pointer-events-none absolute right-0 bottom-0 left-0 flex items-center justify-center gap-1.5 text-xs text-subtle">
            <Icon name="rotate" size={14} />
            {t('home.dragHint')}
          </p>
        </div>
      </div>
    </section>
  );
}

import { useT } from '@/i18n';
import { Badge, Icon, LogoMark } from '@/ui';

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
        className="absolute -top-1/3 left-1/2 size-[42rem] -translate-x-1/2 animate-drift rounded-full blur-3xl"
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

export function HomePage() {
  const t = useT();
  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden">
      <HeroBackground />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <div className="animate-slide-up">
          <LogoMark
            size={72}
            className="drop-shadow-[0_12px_32px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
          />
        </div>
        <Badge tone="accent" className="mt-8 animate-slide-up [animation-delay:60ms]">
          <Icon name="sparkles" size={14} />
          {t('home.eyebrow')}
        </Badge>
        <h1 className="mt-6 max-w-4xl animate-slide-up bg-gradient-to-b from-fg to-fg/70 bg-clip-text font-display text-4xl font-bold tracking-tight text-balance text-transparent [animation-delay:120ms] sm:text-6xl lg:text-7xl">
          {t('home.headline')}
        </h1>
        <p className="mt-6 max-w-2xl animate-slide-up text-lg text-pretty text-muted [animation-delay:180ms] sm:text-xl">
          {t('home.subtitle')}
        </p>
      </div>
    </section>
  );
}

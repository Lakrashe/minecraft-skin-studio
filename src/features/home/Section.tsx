import { useId, type ReactNode } from 'react';
import { cn } from '@/ui';

export function Section({
  id,
  title,
  intro,
  children,
  className,
}: {
  id?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24', className)}
    >
      <header className="mx-auto mb-12 max-w-2xl text-center">
        <h2
          id={headingId}
          className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {title}
        </h2>
        {intro !== undefined && <p className="mt-4 text-lg text-pretty text-muted">{intro}</p>}
      </header>
      {children}
    </section>
  );
}

import { useT } from '@/i18n';
import { cn } from './cn';

export interface SpinnerProps {
  readonly size?: number;
  readonly className?: string;
  /** When true the spinner is hidden from assistive tech (e.g. inside a busy button). */
  readonly decorative?: boolean;
}

export function Spinner({ size = 20, className, decorative = false }: SpinnerProps) {
  const t = useT();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('animate-spin', className)}
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : t('common.loading')}
      aria-hidden={decorative || undefined}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Branded loading indicator: a 3×3 grid of pulsing pixels. */
export function PixelLoader({ className, label }: { className?: string; label?: string }) {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={label ?? t('common.loading')}
      className={cn('grid grid-cols-3 gap-1', className)}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="size-2.5 animate-pixel rounded-[2px] bg-accent"
          style={{ animationDelay: `${String(((i % 3) + Math.floor(i / 3)) * 120)}ms` }}
        />
      ))}
    </div>
  );
}

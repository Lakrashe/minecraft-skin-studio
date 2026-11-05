import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly padded?: boolean;
}

/** Rounded surface used for grouping content (editor panels, settings sections, cards). */
export function Panel({
  title,
  description,
  actions,
  padded = true,
  className,
  children,
  ...rest
}: PanelProps) {
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <section
      className={cn(
        'rounded-panel border border-line bg-surface shadow-panel',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title !== undefined && (
              <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
            )}
            {description !== undefined && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

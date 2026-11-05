import type { ReactNode } from 'react';
import { cn } from './cn';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong border-b-2',
        'bg-surface-2 px-1 font-mono text-[11px] leading-none text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

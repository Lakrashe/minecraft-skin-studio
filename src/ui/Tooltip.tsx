import {
  cloneElement,
  isValidElement,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './cn';

export interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactElement<HTMLAttributes<HTMLElement>>;
  readonly side?: 'top' | 'bottom';
  /** Horizontal alignment relative to the trigger. Use `end` near the right screen edge. */
  readonly align?: TooltipAlign;
  readonly className?: string;
}

export type TooltipAlign = 'start' | 'center' | 'end';

const ALIGN: Readonly<Record<TooltipAlign, string>> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

/**
 * Lightweight tooltip shown on hover and keyboard focus. The trigger gets
 * `aria-describedby` pointing at the tooltip text.
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
  className,
}: TooltipProps) {
  const id = useId();
  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': id })
    : children;

  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-64 rounded-md border border-line',
          ALIGN[align],
          'bg-surface-3 px-2 py-1 text-xs font-medium text-fg shadow-pop',
          'invisible opacity-0 transition-[opacity,visibility] delay-0 duration-150',
          'group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:delay-300',
          // Keyboard focus only — not when a dialog moves focus programmatically.
          'group-has-focus-visible/tooltip:visible group-has-focus-visible/tooltip:opacity-100',
          side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
        )}
      >
        {content}
      </span>
    </span>
  );
}

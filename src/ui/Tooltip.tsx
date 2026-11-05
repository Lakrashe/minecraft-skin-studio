import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
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

/** Hover delay before showing, so tooltips don't flash while the pointer passes by. */
export const TOOLTIP_OPEN_DELAY_MS = 300;

function isFocusVisible(element: EventTarget): boolean {
  if (!(element instanceof Element)) return false;
  try {
    return element.matches(':focus-visible');
  } catch {
    // Environments without :focus-visible support: treat focus as keyboard focus.
    return true;
  }
}

/**
 * Tooltip shown on hover (after a short delay) and on keyboard focus.
 * Meets WCAG 1.4.13: it can be dismissed with Escape without moving focus,
 * the pointer can move onto it without it disappearing, and it stays until
 * hover/focus leaves or it is dismissed. The trigger's existing
 * `aria-describedby` is preserved and the tooltip id is appended.
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
  className,
}: TooltipProps) {
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = (hovered || focused) && !dismissed;

  useEffect(
    () => () => {
      window.clearTimeout(hoverTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDismissed(true);
      // When the trigger has focus, Escape only closes the tooltip — it must
      // not also close an enclosing dialog.
      if (wrapperRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const existing = isValidElement(children) ? children.props['aria-describedby'] : undefined;
  const describedBy = [existing, id].filter(Boolean).join(' ');
  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': describedBy })
    : children;

  return (
    <span
      ref={wrapperRef}
      className={cn('relative inline-flex', className)}
      onPointerEnter={() => {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => {
          setHovered(true);
        }, TOOLTIP_OPEN_DELAY_MS);
      }}
      onPointerLeave={() => {
        window.clearTimeout(hoverTimer.current);
        setHovered(false);
        if (!focused) setDismissed(false);
      }}
      onFocus={(event: FocusEvent) => {
        if (isFocusVisible(event.target)) setFocused(true);
      }}
      onBlur={(event: FocusEvent) => {
        if (wrapperRef.current?.contains(event.relatedTarget)) return;
        setFocused(false);
        if (!hovered) setDismissed(false);
      }}
    >
      {trigger}
      {/* The outer span's padding bridges the gap so the pointer can reach the bubble. */}
      <span
        className={cn(
          'absolute z-50',
          ALIGN[align],
          side === 'bottom' ? 'top-full pt-2' : 'bottom-full pb-2',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <span
          id={id}
          role="tooltip"
          data-state={open ? 'open' : 'closed'}
          className={cn(
            'block w-max max-w-64 rounded-md border border-line bg-surface-3 px-2 py-1',
            'text-xs font-medium text-fg shadow-pop transition-[opacity,visibility] duration-150',
            open ? 'visible opacity-100' : 'invisible opacity-0',
          )}
        >
          {content}
        </span>
      </span>
    </span>
  );
}

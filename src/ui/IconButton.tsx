import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './icons';
import { Kbd } from './Kbd';
import { Tooltip, type TooltipAlign } from './Tooltip';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  readonly icon: IconName;
  /** Accessible name; also shown as the tooltip. Required. */
  readonly label: string;
  /** Optional keyboard shortcut shown in the tooltip. */
  readonly shortcut?: string;
  readonly size?: 'sm' | 'md';
  readonly active?: boolean;
  readonly tooltipSide?: 'top' | 'bottom';
  readonly tooltipAlign?: TooltipAlign;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  icon,
  label,
  shortcut,
  size = 'md',
  active = false,
  tooltipSide = 'bottom',
  tooltipAlign = 'center',
  className,
  type = 'button',
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip
      side={tooltipSide}
      align={tooltipAlign}
      content={
        <span className="flex items-center gap-2">
          {label}
          {shortcut !== undefined && <Kbd>{shortcut}</Kbd>}
        </span>
      }
    >
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-control text-muted transition-colors duration-150',
          'hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-50',
          active && 'bg-accent/15 text-accent hover:bg-accent/20 hover:text-accent',
          size === 'sm' ? 'size-8' : 'size-10',
          className,
        )}
        {...rest}
      >
        <Icon name={icon} size={size === 'sm' ? 16 : 20} />
      </button>
    </Tooltip>
  );
}

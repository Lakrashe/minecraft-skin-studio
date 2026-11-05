import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Shows a spinner, disables the button and sets aria-busy. */
  readonly loading?: boolean;
  readonly leadingIcon?: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
}

const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  primary:
    'bg-accent text-accent-contrast shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_60%,black),0_8px_24px_-10px_color-mix(in_srgb,var(--accent)_70%,transparent)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-2 text-fg border border-line hover:bg-surface-3 hover:border-line-strong',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110 active:brightness-95',
};

const SIZES: Readonly<Record<ButtonSize, string>> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export const buttonClasses = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md') =>
  cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap rounded-control font-medium',
    'transition-[background-color,border-color,color,filter,transform] duration-150',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
  );

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size), className)}
      {...rest}
    >
      {loading ? <Spinner size={16} decorative /> : leadingIcon}
      {children}
    </button>
  );
}

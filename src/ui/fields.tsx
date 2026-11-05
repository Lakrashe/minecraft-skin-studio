import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';

const controlClasses =
  'h-10 w-full rounded-control border border-line bg-bg-raised px-3 text-sm text-fg ' +
  'placeholder:text-subtle transition-colors duration-150 hover:border-line-strong ' +
  'focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ' +
  'disabled:opacity-50 aria-invalid:border-danger';

interface FieldShellProps {
  readonly id: string;
  readonly label: string;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly children: ReactNode;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error !== undefined ? (
        <p id={`${id}-message`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint !== undefined && (
          <p id={`${id}-message`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
}

export function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId();
  const hasMessage = hint !== undefined || error !== undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={hasMessage ? `${id}-message` : undefined}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </FieldShell>
  );
}

export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SelectProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'value' | 'onChange'
> {
  readonly label: string;
  readonly hint?: string;
  readonly value: T;
  readonly options: readonly SelectOption<T>[];
  readonly onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  className,
  ...rest
}: SelectProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <select
        id={id}
        value={value}
        aria-describedby={hint !== undefined ? `${id}-message` : undefined}
        onChange={(event) => {
          const next = options.find((o) => o.value === event.target.value);
          if (next) onChange(next.value);
        }}
        className={cn(controlClasses, 'cursor-pointer appearance-none pr-9', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23889' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
        }}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type' | 'value' | 'onChange'
> {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly formatValue?: (value: number) => string;
}

export function Slider({ label, value, onChange, formatValue, className, ...rest }: SliderProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs text-muted tabular-nums">
          {formatValue ? formatValue(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        value={value}
        onChange={(event) => {
          onChange(event.target.valueAsNumber);
        }}
        className={cn('h-2 w-full cursor-pointer accent-[var(--accent)]', className)}
        {...rest}
      />
    </div>
  );
}

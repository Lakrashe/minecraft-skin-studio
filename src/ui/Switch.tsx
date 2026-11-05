import { useId } from 'react';
import { cn } from './cn';

export interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div id={labelId} className="text-sm font-medium">
          {label}
        </div>
        {description !== undefined && (
          <p id={descriptionId} className="text-sm text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description !== undefined ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => {
          onChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150',
          'disabled:opacity-50',
          checked ? 'border-transparent bg-accent' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block size-4.5 rounded-full shadow transition-transform duration-150',
            checked ? 'translate-x-5.5 bg-accent-contrast' : 'translate-x-0.5 bg-fg/80',
          )}
        />
      </button>
    </div>
  );
}

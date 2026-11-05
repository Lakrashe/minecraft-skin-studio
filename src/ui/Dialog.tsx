import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useT } from '@/i18n';
import { cn } from './cn';
import { IconButton } from './IconButton';

export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  /** Action buttons, rendered right-aligned at the bottom. */
  readonly footer?: ReactNode;
  /** `sheet` slides in from the side — used for the mobile navigation. */
  readonly variant?: 'center' | 'sheet';
  readonly className?: string;
}

/**
 * Modal dialog built on the native <dialog> element: focus trapping, Escape
 * to close and inert background come from the browser.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'center',
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const t = useT();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop targets the <dialog> element itself.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        'border border-line bg-surface p-0 text-fg shadow-pop backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        variant === 'center'
          ? 'm-auto w-[calc(100%-2rem)] max-w-md animate-pop-in rounded-panel'
          : 'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[min(20rem,100%-3rem)] animate-slide-up rounded-l-panel',
        className,
      )}
    >
      {open && (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-4 p-5 pb-0">
            <div>
              <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description !== undefined && (
                <p id={descriptionId} className="mt-1.5 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton icon="close" size="sm" label={t('common.close')} onClick={onClose} />
          </header>
          {children !== undefined && <div className="flex-1 p-5">{children}</div>}
          {footer !== undefined && (
            <footer className="flex justify-end gap-2 p-5 pt-2">{footer}</footer>
          )}
        </div>
      )}
    </dialog>
  );
}

import { useEffect } from 'react';
import { useT } from '@/i18n';
import { cn } from '../cn';
import { Icon, type IconName } from '../icons';
import { useToastStore, type Toast, type ToastTone } from './toast-store';

const TONE_STYLE: Readonly<Record<ToastTone, { icon: IconName; className: string }>> = {
  info: { icon: 'info', className: 'text-accent' },
  success: { icon: 'checkCircle', className: 'text-success' },
  warning: { icon: 'alert', className: 'text-warning' },
  error: { icon: 'alert', className: 'text-danger' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const t = useT();
  const style = TONE_STYLE[toast.tone];

  useEffect(() => {
    if (toast.duration === null) return;
    const timer = window.setTimeout(() => {
      dismiss(toast.id);
    }, toast.duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast.id, toast.duration, dismiss]);

  return (
    <li
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full animate-slide-up items-start gap-3 rounded-control border border-line bg-surface-2 p-3 pr-2 shadow-pop"
    >
      <Icon name={style.icon} className={cn('mt-0.5 shrink-0', style.className)} />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        aria-label={t('common.dismiss')}
        onClick={() => {
          dismiss(toast.id);
        }}
        className="rounded p-1 text-subtle hover:bg-surface-3 hover:text-fg"
      >
        <Icon name="close" size={16} />
      </button>
    </li>
  );
}

/** Renders queued toasts. Mount once at the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const t = useT();
  return (
    <section
      aria-label={t('common.notifications')}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end"
    >
      <ol className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} />
        ))}
      </ol>
    </section>
  );
}

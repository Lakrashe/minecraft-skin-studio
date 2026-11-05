import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  readonly id: number;
  readonly tone: ToastTone;
  readonly message: string;
  /** Milliseconds before auto-dismiss; `null` keeps it until dismissed. */
  readonly duration: number | null;
}

interface ToastState {
  readonly toasts: readonly Toast[];
  push: (toast: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

const MAX_VISIBLE = 4;
let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => {
    set({ toasts: [] });
  },
}));

const DEFAULT_DURATION: Readonly<Record<ToastTone, number | null>> = {
  info: 4000,
  success: 3500,
  warning: 6000,
  error: null,
};

const show = (tone: ToastTone) => (message: string, options?: { duration?: number | null }) =>
  useToastStore.getState().push({
    tone,
    message,
    duration: options?.duration === undefined ? DEFAULT_DURATION[tone] : options.duration,
  });

/** Imperative toast API usable from anywhere (components, controllers). */
export const toast = {
  info: show('info'),
  success: show('success'),
  warning: show('warning'),
  error: show('error'),
  dismiss: (id: number) => {
    useToastStore.getState().dismiss(id);
  },
};

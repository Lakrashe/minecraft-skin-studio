import { useEffect, useState, type RefObject } from 'react';

export interface Visibility {
  /** The element has been within the margin of the viewport at least once. */
  readonly seen: boolean;
  /** The element is within the margin of the viewport and displayed right now. */
  readonly visible: boolean;
}

/**
 * Tracks whether an element is on screen. `display: none` (e.g. a hidden
 * mobile tab) counts as not visible. Without IntersectionObserver the element
 * is treated as visible. Use `seen` to defer loading and `visible` to pause
 * work such as rendering.
 */
export function useVisibility(ref: RefObject<Element | null>, rootMargin = '0px'): Visibility {
  const [state, setState] = useState<Visibility>({ seen: false, visible: false });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setState({ seen: true, visible: true });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const visible = entry.isIntersecting;
        setState((prev) =>
          prev.visible === visible && (prev.seen || !visible)
            ? prev
            : { seen: prev.seen || visible, visible },
        );
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin]);
  return state;
}

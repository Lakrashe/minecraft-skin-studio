import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the element has come within `rootMargin` of the viewport. Used to
 * defer WebGL views below the fold. Stays true afterwards.
 */
export function useInView(ref: RefObject<Element | null>, rootMargin = '200px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin, inView]);
  return inView;
}

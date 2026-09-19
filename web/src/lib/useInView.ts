import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has scrolled into view. Fires once and stays true.
 * Where IntersectionObserver is missing, the element counts as already seen, so
 * nothing stays hidden waiting for an event that will never arrive.
 */
export function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (seen || !node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, threshold]);

  return [ref, seen] as const;
}

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

/**
 * Custom hook for Intersection Observer API
 * Useful for lazy loading, infinite scroll, and scroll animations
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;
  
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already visible and frozen, don't create observer
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        
        // Unobserve if frozen once visible
        if (entry.isIntersecting && freezeOnceVisible) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return [elementRef, isVisible];
}
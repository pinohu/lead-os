/**
 * Performance monitoring and optimization utilities
 */

import { logger } from './logger';

/**
 * Measure component render time
 */
export const measureRenderTime = (componentName: string, startTime: number) => {
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (renderTime > 16) { // Flag renders slower than 60fps
    logger.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
  }
};

/**
 * Log performance metrics
 */
export const logPerformanceMetrics = () => {
  if (import.meta.env.DEV && 'performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (perfData) {
          logger.log('[Performance Metrics]', {
            'DNS Lookup': `${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`,
            'TCP Connection': `${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`,
            'Request Time': `${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`,
            'Response Time': `${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`,
            'DOM Content Loaded': `${(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart).toFixed(2)}ms`,
            'Total Load Time': `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
          });
        }
      }, 0);
    });
  }
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (img: HTMLImageElement) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        const src = image.dataset.src;
        
        if (src) {
          image.src = src;
          image.removeAttribute('data-src');
          observer.unobserve(image);
        }
      }
    });
  });
  
  observer.observe(img);
};

/**
 * Prefetch route for faster navigation
 */
export const prefetchRoute = (path: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
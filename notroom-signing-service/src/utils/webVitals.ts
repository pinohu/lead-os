/**
 * Core Web Vitals Tracking
 * Tracks LCP, FID, CLS, FCP, TTFB, INP for performance monitoring
 */

import { logger } from './logger';
import { checkPerformanceThresholds } from './performanceAlerts';

export interface Metric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

const STORAGE_KEY = 'web-vitals-metrics';
const MAX_STORED_METRICS = 100; // Keep last 100 metrics

// Store metric in localStorage for dashboard
const storeMetric = (metric: Metric) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const metrics: Metric[] = stored ? JSON.parse(stored) : [];
    
    // Add new metric
    metrics.push({
      ...metric,
      timestamp: Date.now(),
    });
    
    // Keep only last MAX_STORED_METRICS
    if (metrics.length > MAX_STORED_METRICS) {
      metrics.shift();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    
    // Check for alerts
    const alerts = checkPerformanceThresholds({ [metric.name]: metric.value });
    if (alerts.length > 0) {
      logger.warn('[Performance Alert]', alerts[0].message);
    }
  } catch (error) {
    logger.warn('Failed to store Web Vitals metric:', error);
  }
};

// Get stored metrics for dashboard
export const getStoredMetrics = (): Metric[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Get latest metrics by name
export const getLatestMetrics = (): Record<string, Metric> => {
  const metrics = getStoredMetrics();
  const latest: Record<string, Metric> = {};
  
  // Get most recent metric for each type
  for (const metric of metrics) {
    if (!latest[metric.name] || metric.timestamp > latest[metric.name].timestamp) {
      latest[metric.name] = metric;
    }
  }
  
  return latest;
};

// Send metrics to analytics
const sendToAnalytics = (metric: Metric) => {
  // Send to Google Analytics
  const win = window as Window & { gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void };
  if (typeof window !== 'undefined' && win.gtag) {
    win.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Log in development
  logger.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
  });
  
  // Store metric for dashboard
  storeMetric(metric);
};

// Get rating for metric
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Initialize Web Vitals tracking
export const initWebVitals = () => {
  // Track in both dev and production for dashboard
  // Use setTimeout to ensure this doesn't block app initialization
  setTimeout(() => {
    // Dynamic import to avoid bundling issues
    import('web-vitals')
      .then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
        try {
          onCLS((metric) => {
            const enhancedMetric: Metric = {
              ...metric,
              rating: getRating('CLS', metric.value),
              timestamp: Date.now(),
            };
            sendToAnalytics(enhancedMetric);
          });

          onFID((metric) => {
            const enhancedMetric: Metric = {
              ...metric,
              rating: getRating('FID', metric.value),
              timestamp: Date.now(),
            };
            sendToAnalytics(enhancedMetric);
          });

          onFCP((metric) => {
            const enhancedMetric: Metric = {
              ...metric,
              rating: getRating('FCP', metric.value),
              timestamp: Date.now(),
            };
            sendToAnalytics(enhancedMetric);
          });

          onLCP((metric) => {
            const enhancedMetric: Metric = {
              ...metric,
              rating: getRating('LCP', metric.value),
              timestamp: Date.now(),
            };
            sendToAnalytics(enhancedMetric);
          });

          onTTFB((metric) => {
            const enhancedMetric: Metric = {
              ...metric,
              rating: getRating('TTFB', metric.value),
              timestamp: Date.now(),
            };
            sendToAnalytics(enhancedMetric);
          });

          // INP (Interaction to Next Paint) - newer metric
          if (onINP) {
            onINP((metric) => {
              const enhancedMetric: Metric = {
                ...metric,
                rating: getRating('INP', metric.value),
                timestamp: Date.now(),
              };
              sendToAnalytics(enhancedMetric);
            });
          }
        } catch (error) {
          logger.warn('Web Vitals initialization error:', error);
        }
      })
      .catch((error) => {
        // web-vitals not available - continue without tracking
        logger.warn('Web Vitals tracking not available:', error);
      });
  }, 0);
};


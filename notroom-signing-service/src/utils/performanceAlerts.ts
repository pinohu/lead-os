/**
 * Performance alert thresholds and notification system
 */

export interface PerformanceThresholds {
  warning: number;
  error: number;
}

export const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThresholds> = {
  LCP: { warning: 2500, error: 4000 }, // ms
  FID: { warning: 100, error: 300 }, // ms
  CLS: { warning: 0.1, error: 0.25 },
  TTFB: { warning: 800, error: 1800 }, // ms
  FCP: { warning: 1800, error: 3000 }, // ms
  INP: { warning: 200, error: 500 }, // ms
};

export interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: PerformanceThresholds;
  severity: 'warning' | 'error';
  message: string;
  timestamp: number;
}

export function checkPerformanceThresholds(
  metrics: Record<string, number>
): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  for (const [metric, value] of Object.entries(metrics)) {
    const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) continue;

    if (value > threshold.error) {
      alerts.push({
        metric,
        value,
        threshold,
        severity: 'error',
        message: `CRITICAL: ${metric} is ${value.toFixed(2)}${metric === 'CLS' ? '' : 'ms'} (threshold: ${threshold.error}${metric === 'CLS' ? '' : 'ms'})`,
        timestamp: Date.now(),
      });
    } else if (value > threshold.warning) {
      alerts.push({
        metric,
        value,
        threshold,
        severity: 'warning',
        message: `WARNING: ${metric} is ${value.toFixed(2)}${metric === 'CLS' ? '' : 'ms'} (threshold: ${threshold.warning}${metric === 'CLS' ? '' : 'ms'})`,
        timestamp: Date.now(),
      });
    }
  }

  return alerts;
}

/**
 * Get performance rating for a metric value
 */
export function getPerformanceRating(
  metric: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.warning) return 'good';
  if (value <= threshold.error) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metric: string, value: number): string {
  if (metric === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}






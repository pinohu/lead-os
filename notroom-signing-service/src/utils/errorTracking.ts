/**
 * Production Error Tracking Utility
 * Integrates with Sentry for production error monitoring
 */

import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  path?: string;
  component?: string;
  [key: string]: unknown;
}

class ErrorTracker {
  private sentryEnabled = false;
  private sentryDsn: string | null = null;

  constructor() {
    // Check if Sentry DSN is configured
    this.sentryDsn = import.meta.env.VITE_SENTRY_DSN || null;
    this.sentryEnabled = !!this.sentryDsn && !import.meta.env.DEV;

    if (this.sentryEnabled) {
      this.initSentry();
    }
  }

  private initSentry() {
    // Dynamic import to avoid bundling Sentry in dev
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: this.sentryDsn!,
        environment: import.meta.env.MODE,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1, // 10% of transactions
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        beforeSend(event) {
          // Filter out sensitive data
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          return event;
        },
      });
    }).catch(() => {
      // Sentry failed to load - continue without it
      logger.warn('Sentry failed to initialize');
    });
  }

  captureException(error: Error, context?: ErrorContext) {
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            custom: context || {},
          },
        });
      }).catch(() => {
        // Fallback to logger in case Sentry fails
        logger.error('Error tracking failed:', error, context);
      });
    } else {
      // Development mode - just log
      logger.error('Error captured:', error, context);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: level as 'info' | 'warning' | 'error',
          contexts: {
            custom: context || {},
          },
        });
      }).catch(() => {
        logger.warn('Error tracking failed:', message, context);
      });
    } else {
      logger.log(`[${level.toUpperCase()}]`, message, context);
    }
  }

  setUser(userId: string, email?: string) {
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser({
          id: userId,
          email: email,
        });
      }).catch(() => {
        // Silent fail
      });
    }
  }

  clearUser() {
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(null);
      }).catch(() => {
        // Silent fail
      });
    }
  }
}

export const errorTracker = new ErrorTracker();

// Helper function for React Error Boundaries
export const captureReactError = (error: Error, errorInfo: React.ErrorInfo) => {
  errorTracker.captureException(error, {
    component: errorInfo.componentStack?.split('\n')[0] || 'Unknown',
    errorInfo: errorInfo.componentStack,
  });
};


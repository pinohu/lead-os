/**
 * Global type definitions for window extensions and third-party libraries
 */

// Cloudflare Turnstile
interface Turnstile {
  render: (
    element: string | HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
    turnstile?: Turnstile;
    onTurnstileSuccess?: (token: string) => void;
  }
}

export {};

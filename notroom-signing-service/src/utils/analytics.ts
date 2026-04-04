/**
 * Analytics utility functions for tracking user interactions
 * Replace with actual analytics service in production (Google Analytics, Mixpanel, etc.)
 */

import { logger } from './logger';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export const trackEvent = (eventName: string, properties?: EventProperties) => {
  logger.log('[Analytics]', eventName, properties);

  // Send to Google Analytics 4
  const win = window as Window & { gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void };
  if (typeof window !== 'undefined' && win.gtag) {
    win.gtag('event', eventName, properties);
  }
};

export const trackPageView = (path: string, title: string) => {
  logger.log('[Analytics] Page view:', path, title);

  // Send to Google Analytics 4
  const win = window as Window & { gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void };
  if (typeof window !== 'undefined' && win.gtag) {
    win.gtag('config', 'G-HZ29KE41TZ', {
      page_path: path,
      page_title: title,
    });
  }
};

export const trackBooking = (service: string, location?: string) => {
  trackEvent('booking_initiated', {
    service,
    location: location || 'not_specified',
    timestamp: Date.now(),
  });
};

export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('form_submission', {
    form_name: formName,
    success,
    timestamp: Date.now(),
  });
};

export const trackPhoneClick = () => {
  trackEvent('phone_clicked', {
    timestamp: Date.now(),
  });
};

export const trackEmailClick = () => {
  trackEvent('email_clicked', {
    timestamp: Date.now(),
  });
};

export const trackCTAClick = (ctaLocation: string, ctaText: string) => {
  trackEvent('cta_clicked', {
    location: ctaLocation,
    text: ctaText,
    timestamp: Date.now(),
  });
};

// Lead Generation Tracking
export const trackLeadMagnet = (email: string, name: string) => {
  trackEvent('lead_captured', {
    source: 'lead_magnet',
    email,
    name,
    timestamp: Date.now(),
  });
};

export const trackQuizCompletion = (answers: Record<string, string>) => {
  trackEvent('quiz_completed', {
    answers: JSON.stringify(answers),
    timestamp: Date.now(),
  });
};

export const trackTripwireView = () => {
  trackEvent('tripwire_viewed', {
    timestamp: Date.now(),
  });
};

export const trackValueLadderInteraction = (level: string) => {
  trackEvent('value_ladder_interaction', {
    level,
    timestamp: Date.now(),
  });
};
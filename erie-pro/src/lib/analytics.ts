// ── Analytics (PostHog) ───────────────────────────────────────────────
// Lightweight server-side event tracking.
// Only active when NEXT_PUBLIC_POSTHOG_KEY is set.

import { logger } from "@/lib/logger";

interface AnalyticsEvent {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Track a server-side event. Fire-and-forget.
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (!POSTHOG_KEY) {
    logger.debug("analytics", `[DRY RUN] ${event.event}`, event.properties);
    return;
  }

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: event.event,
        distinct_id: event.distinctId,
        properties: {
          ...event.properties,
          $lib: "erie-pro-server",
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    logger.error("analytics", "PostHog capture failed:", err);
  }
}

// ── Preset Events ────────────────────────────────────────────────────

export function trackLeadSubmitted(niche: string, city: string, hasProvider: boolean) {
  trackEvent({
    event: "lead_submitted",
    distinctId: `${niche}:${city}`,
    properties: { niche, city, hasProvider },
  }).catch((err) => { logger.error("analytics", "Analytics tracking failed", err) });
}

export function trackTerritoryClaimed(niche: string, city: string, providerId: string) {
  trackEvent({
    event: "territory_claimed",
    distinctId: providerId,
    properties: { niche, city },
  }).catch((err) => { logger.error("analytics", "Analytics tracking failed", err) });
}

export function trackLeadPurchased(niche: string, temperature: string, buyerEmail: string) {
  trackEvent({
    event: "lead_purchased",
    distinctId: buyerEmail,
    properties: { niche, temperature },
  }).catch((err) => { logger.error("analytics", "Analytics tracking failed", err) });
}

export function trackDisputeFiled(providerId: string, reason: string) {
  trackEvent({
    event: "dispute_filed",
    distinctId: providerId,
    properties: { reason },
  }).catch((err) => { logger.error("analytics", "Analytics tracking failed", err) });
}

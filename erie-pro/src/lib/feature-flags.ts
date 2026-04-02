// ── Feature Flags ─────────────────────────────────────────────────────
// Server-side feature flag system for controlled rollouts.
// Flags can be set via environment variables or hardcoded defaults.
//
// Usage:
//   import { isFeatureEnabled } from "@/lib/feature-flags";
//   if (isFeatureEnabled("ab_new_claim_form")) { ... }
//
// To enable via env: FEATURE_AB_NEW_CLAIM_FORM=true

export type FeatureFlag =
  | "email_notifications"     // Send real emails via Emailit
  | "posthog_analytics"       // PostHog server-side event tracking
  | "sentry_errors"           // Sentry error reporting
  | "stripe_live"             // Use live Stripe keys (vs test/dry-run)
  | "ab_new_claim_form"       // A/B test: redesigned claim form
  | "ab_urgency_banner"       // A/B test: urgency banner on directory pages
  | "ab_social_proof"         // A/B test: social proof notifications
  | "multi_city"              // Enable multi-city routing
  | "lead_sla_enforcement"    // Auto-failover leads after SLA timeout
  | "review_automation"       // Automated review request emails
  | "competitive_intel"       // Show competitor intelligence to premium providers
  | "provider_chat"           // In-dashboard live chat with leads
  | "stripe_billing_portal"   // Stripe customer portal for self-serve billing
  | "ccpa_auto_deletion";     // Auto-process CCPA deletion requests

interface FlagConfig {
  /** Default value when no env override exists */
  default: boolean;
  /** Description for documentation */
  description: string;
  /** Phase when this flag was introduced */
  phase: number;
}

const FLAG_REGISTRY: Record<FeatureFlag, FlagConfig> = {
  email_notifications: {
    default: false,
    description: "Send real transactional emails via Emailit API",
    phase: 4,
  },
  posthog_analytics: {
    default: false,
    description: "PostHog server-side event tracking",
    phase: 4,
  },
  sentry_errors: {
    default: false,
    description: "Sentry error reporting",
    phase: 4,
  },
  stripe_live: {
    default: false,
    description: "Use live Stripe keys (default: test mode / dry-run)",
    phase: 1,
  },
  ab_new_claim_form: {
    default: false,
    description: "A/B test: redesigned territory claim form with progress steps",
    phase: 5,
  },
  ab_urgency_banner: {
    default: false,
    description: "A/B test: show lead count urgency banner on directory pages",
    phase: 5,
  },
  ab_social_proof: {
    default: false,
    description: "A/B test: real-time social proof notifications (X leads this week)",
    phase: 5,
  },
  multi_city: {
    default: false,
    description: "Enable multi-city routing and cross-city navigation",
    phase: 5,
  },
  lead_sla_enforcement: {
    default: false,
    description: "Auto-failover leads to backup provider after SLA timeout",
    phase: 4,
  },
  review_automation: {
    default: false,
    description: "Automated review request emails after lead conversion",
    phase: 5,
  },
  competitive_intel: {
    default: false,
    description: "Show competitor territory intel to premium subscribers",
    phase: 5,
  },
  provider_chat: {
    default: false,
    description: "In-dashboard live chat between providers and leads",
    phase: 5,
  },
  stripe_billing_portal: {
    default: false,
    description: "Enable Stripe customer billing portal for self-serve management",
    phase: 5,
  },
  ccpa_auto_deletion: {
    default: false,
    description: "Auto-process CCPA data deletion requests (vs manual review)",
    phase: 5,
  },
};

/**
 * Check if a feature flag is enabled.
 * Priority: env var FEATURE_<FLAG_NAME> > hardcoded default
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = `FEATURE_${flag.toUpperCase()}`;
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    return envValue === "true" || envValue === "1";
  }

  return FLAG_REGISTRY[flag]?.default ?? false;
}

/**
 * Get all flags and their current states (for admin dashboard).
 */
export function getAllFlags(): Record<FeatureFlag, { enabled: boolean; description: string; phase: number }> {
  const result = {} as Record<FeatureFlag, { enabled: boolean; description: string; phase: number }>;

  for (const [flag, config] of Object.entries(FLAG_REGISTRY)) {
    result[flag as FeatureFlag] = {
      enabled: isFeatureEnabled(flag as FeatureFlag),
      description: config.description,
      phase: config.phase,
    };
  }

  return result;
}

/**
 * Simple hash-based A/B test assignment.
 * Returns "control" or "variant" deterministically for a given user+test pair.
 * This ensures the same user always sees the same variant.
 */
export function getABVariant(
  testName: string,
  userId: string,
  splitPercent = 50
): "control" | "variant" {
  // Simple hash: sum char codes of testName + userId
  let hash = 0;
  const key = `${testName}:${userId}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  // Normalize to 0-99
  const bucket = Math.abs(hash) % 100;
  return bucket < splitPercent ? "control" : "variant";
}

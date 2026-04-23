// ---------------------------------------------------------------------------
// Field length limits
// ---------------------------------------------------------------------------

/**
 * Maximum byte/character lengths for user-supplied string fields.
 * Enforced at API boundaries to prevent memory exhaustion from unbounded input.
 */
export const LIMITS = {
  MAX_BRAND_NAME_LENGTH: 200,
  MAX_SLUG_LENGTH: 50,
  MAX_EMAIL_LENGTH: 254,
  MAX_URL_LENGTH: 500,
  MAX_EXPERIMENT_NAME_LENGTH: 200,
  MAX_VARIANT_NAME_LENGTH: 100,
  MAX_LEAD_KEY_LENGTH: 128,
  MAX_VARIANTS_COUNT: 20,
  MAX_OPERATOR_EMAILS: 50,
  MAX_METADATA_KEYS: 20,
  MAX_METADATA_KEY_LENGTH: 64,
  MAX_METADATA_VALUE_LENGTH: 512,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ---------------------------------------------------------------------------
// Timeouts
// ---------------------------------------------------------------------------

/**
 * Timeout durations in milliseconds for outbound calls.
 * All external fetch calls must apply an AbortSignal derived from these values.
 */
export const TIMEOUTS = {
  EXTERNAL_API: 15_000,
  DATABASE_QUERY: 5_000,
  WEBHOOK_DELIVERY: 30_000,
} as const;

// ---------------------------------------------------------------------------
// Enumerated domain values
// ---------------------------------------------------------------------------

/** Allowed values for the `revenueModel` field on a tenant record. */
export const VALID_REVENUE_MODELS = [
  "managed",
  "white-label",
  "implementation",
  "directory",
] as const;

/** Allowed values for the `plan` field on a tenant record. */
export const VALID_PLANS = ["starter", "growth", "enterprise", "custom"] as const;

/** Allowed values for the `status` field on a tenant record. */
export const VALID_TENANT_STATUSES = [
  "provisioning",
  "active",
  "suspended",
  "cancelled",
] as const;

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/**
 * Validates a URL-safe slug: lowercase alphanumeric, hyphens in the middle,
 * must start and end with an alphanumeric character.
 */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

// ---------------------------------------------------------------------------
// Store / cache settings
// ---------------------------------------------------------------------------

/**
 * Maximum number of entries retained in bounded in-memory arrays before the
 * oldest entries are evicted. Prevents unbounded memory growth in long-running
 * processes.
 */
export const STORE_MAX_ARRAY_SIZE = 10_000;

/** Default time-to-live for application-level cache entries (5 minutes). */
export const CACHE_DEFAULT_TTL_MS = 5 * 60 * 1000;

// src/lib/pricing/retry-policy.ts
// BullMQ job retry semantics — see docs/RETRY-DLQ-POLICY.md.

/** Errors that should exhaust BullMQ attempts and go to DLQ (non-transient misconfiguration). */
export const PRICING_NON_RETRYABLE_MESSAGE_MARKERS = [
  "pricing_sku not found",
  "not found:",
  "invalid input",
  "validation",
  "ECONNREFUSED",
] as const;

/** Default BullMQ attempts for pricing queues (see queue-client defaultJobOpts). */
export const PRICING_DEFAULT_MAX_ATTEMPTS = 5;

export function isLikelyNonRetryablePricingError(message: string): boolean {
  const m = message.toLowerCase();
  for (const marker of PRICING_NON_RETRYABLE_MESSAGE_MARKERS) {
    if (m.includes(String(marker).toLowerCase())) return true;
  }
  return false;
}

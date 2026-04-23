// src/lib/gtm/status.ts
// Operator-facing GTM rollout status values persisted per tenant + use-case slug.

export const GTM_OPERATOR_STATUSES = [
  "not_started",
  "in_progress",
  "live",
  "paused",
] as const;

export type GtmOperatorStatus = (typeof GTM_OPERATOR_STATUSES)[number];

export function isGtmOperatorStatus(value: string): value is GtmOperatorStatus {
  return (GTM_OPERATOR_STATUSES as readonly string[]).includes(value);
}

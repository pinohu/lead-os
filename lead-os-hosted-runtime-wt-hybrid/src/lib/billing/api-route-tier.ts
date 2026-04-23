// src/lib/billing/api-route-tier.ts
// Maps authenticated API routes to minimum plan API tier when billing enforcement is on.

export type ApiAccessTierRequirement = "none" | "standard" | "full";

/**
 * Operator and pricing-control surfaces require `full` tier on the subscription plan.
 * All other authenticated routes require at least `standard`.
 */
export function getRequiredApiAccessTier(pathname: string, _method: string): ApiAccessTierRequirement {
  if (pathname.startsWith("/api/operator")) return "full";
  return "standard";
}

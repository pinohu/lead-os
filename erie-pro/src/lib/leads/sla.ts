// ── Lead SLA + failover logic ────────────────────────────────────────
// Pure helpers that govern the provider-response funnel:
//   • Compute SLA deadlines based on urgency
//   • Detect expired SLAs
//   • Select the next provider for failover when a primary doesn't respond
//
// All functions here are pure (no IO, no clock except via `now` arg).
// The DB-touching orchestrator lives in `sla-orchestrator.ts` and uses
// these helpers.

export type LeadUrgency = "emergency" | "this-week" | "researching";

/**
 * SLA windows in seconds. Tuned for typical service-trade response
 * expectations on erie.pro:
 *   • emergency:    20 minutes  — visitor needs help RIGHT NOW
 *   • this-week:    4 hours     — same-business-day acceptable
 *   • researching:  24 hours    — quote-shopping; lower urgency
 *
 * If the primary doesn't accept within the window, the lead fails over
 * to the next provider in the territory rotation.
 */
export const SLA_SECONDS: Record<LeadUrgency, number> = {
  emergency: 20 * 60,
  "this-week": 4 * 60 * 60,
  researching: 24 * 60 * 60,
};

/**
 * After this many failover attempts the lead is escalated to the
 * concierge line and marked as unmatched.
 */
export const MAX_FAILOVER_ATTEMPTS = 3;

export function computeSlaDeadline(
  urgency: LeadUrgency | string | null | undefined,
  createdAt: Date
): Date {
  const u =
    urgency && urgency in SLA_SECONDS
      ? (urgency as LeadUrgency)
      : ("this-week" as LeadUrgency);
  return new Date(createdAt.getTime() + SLA_SECONDS[u] * 1000);
}

export function isSlaExpired(slaDeadline: Date | null | undefined, now: Date = new Date()): boolean {
  if (!slaDeadline) return false;
  return now.getTime() > slaDeadline.getTime();
}

/**
 * Returns the remaining SLA time in seconds (positive = time left,
 * negative = expired by N seconds). Returns null when no deadline.
 */
export function slaSecondsRemaining(
  slaDeadline: Date | null | undefined,
  now: Date = new Date()
): number | null {
  if (!slaDeadline) return null;
  return Math.floor((slaDeadline.getTime() - now.getTime()) / 1000);
}

/**
 * Pick the next failover provider from a sorted candidate list.
 *
 * Rules:
 *   • Skip the current routedTo (already had a turn)
 *   • Skip any provider that already has a LeadOutcome of "declined" for this lead
 *   • Prefer providers in tier order: primary → failover → overflow
 *   • Among same tier, prefer lower failoverAttempts (load balancing)
 *
 * Returns null when nothing is available (caller should mark unmatched
 * and escalate to concierge).
 */
export interface FailoverCandidate {
  providerId: string;
  tier: "primary" | "failover" | "overflow";
  /** How many leads have failed over to this provider today */
  todaysFailoverLoad: number;
  /** True if this provider is currently accepting leads */
  acceptingLeads: boolean;
  /** Has this provider already declined THIS specific lead */
  hasDeclinedThisLead: boolean;
}

const TIER_RANK: Record<"primary" | "failover" | "overflow", number> = {
  primary: 0,
  failover: 1,
  overflow: 2,
};

export function pickFailoverTarget(
  currentProviderId: string | null,
  candidates: readonly FailoverCandidate[]
): FailoverCandidate | null {
  const eligible = candidates.filter(
    (c) =>
      c.providerId !== currentProviderId &&
      c.acceptingLeads &&
      !c.hasDeclinedThisLead
  );
  if (eligible.length === 0) return null;

  // Sort by (tier asc, load asc, id asc) — last is just to ensure stable
  // ordering when ties happen
  const sorted = [...eligible].sort((a, b) => {
    if (TIER_RANK[a.tier] !== TIER_RANK[b.tier]) {
      return TIER_RANK[a.tier] - TIER_RANK[b.tier];
    }
    if (a.todaysFailoverLoad !== b.todaysFailoverLoad) {
      return a.todaysFailoverLoad - b.todaysFailoverLoad;
    }
    return a.providerId.localeCompare(b.providerId);
  });

  return sorted[0];
}

/**
 * Determine the lead's effective state from its routing/outcome fields.
 * Independent of any specific persistence layer.
 */
export type LeadResponseState =
  | "awaiting-provider" // routed to a provider, SLA still open
  | "accepted"          // provider has responded
  | "declined"          // provider declined; awaiting failover
  | "expired"           // SLA passed without response
  | "exhausted"         // failover attempts ≥ MAX, no taker
  | "completed"         // converted or otherwise resolved
  | "unrouted";         // no provider yet

export interface LeadResponseContext {
  routedToId: string | null;
  slaDeadline: Date | null;
  failoverAttempts: number;
  outcomeType: "responded" | "converted" | "no_response" | "declined" | "cancelled" | null;
}

export function inferLeadResponseState(
  ctx: LeadResponseContext,
  now: Date = new Date()
): LeadResponseState {
  if (ctx.outcomeType === "converted") return "completed";
  if (ctx.outcomeType === "responded") return "accepted";
  if (ctx.outcomeType === "declined") {
    return ctx.failoverAttempts >= MAX_FAILOVER_ATTEMPTS ? "exhausted" : "declined";
  }
  if (ctx.outcomeType === "cancelled" || ctx.outcomeType === "no_response") {
    return ctx.failoverAttempts >= MAX_FAILOVER_ATTEMPTS ? "exhausted" : "expired";
  }
  // No outcome yet
  if (!ctx.routedToId) return "unrouted";
  if (isSlaExpired(ctx.slaDeadline, now)) {
    return ctx.failoverAttempts >= MAX_FAILOVER_ATTEMPTS ? "exhausted" : "expired";
  }
  return "awaiting-provider";
}

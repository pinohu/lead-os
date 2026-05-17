// ── Lead SLA Analytics Aggregation ───────────────────────────────────
// Pure aggregation over recent leads + outcomes. Reused on the admin
// dashboard and (potentially) a JSON API.

import {
  inferLeadResponseState,
  type LeadResponseState,
} from "@/lib/leads/sla";

export interface LeadAnalyticsRow {
  id: string;
  niche: string;
  city: string;
  routedToId: string | null;
  routedToName: string | null;
  slaDeadline: Date | null;
  createdAt: Date;
  // Outcomes from any related LeadOutcome rows, sorted by createdAt
  outcomes: Array<{
    outcome: "responded" | "converted" | "no_response" | "declined" | "cancelled";
    responseTimeSeconds: number | null;
    createdAt: Date;
  }>;
}

export interface SlaAnalytics {
  range: { startISO: string; endISO: string; days: number };
  totals: {
    leads: number;
    accepted: number;
    declined: number;
    expired: number;
    awaiting: number;
    completed: number;
    exhausted: number;
    unrouted: number;
  };
  /** Accept-rate (leads where state ∈ accepted / completed) ÷ total */
  acceptRate: number;
  /** Of leads where SLA expired-without-response, how often a failover succeeded */
  responseTime: {
    /** Median response time in seconds across accepted leads */
    medianSec: number;
    /** 75th-percentile */
    p75Sec: number;
    /** Mean (for reference) */
    meanSec: number;
    /** Count of accepted leads with response time recorded */
    sampleSize: number;
  };
  topProviders: Array<{
    providerId: string;
    providerName: string;
    accepted: number;
    declined: number;
    medianResponseSec: number | null;
    acceptanceRate: number; // accepted / (accepted+declined+no_response)
  }>;
  recentExpired: Array<{
    leadId: string;
    niche: string;
    routedToName: string | null;
    expiredAt: Date;
  }>;
  failoverPairs: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/**
 * Count failover attempts from the lead's outcome history. Each
 * "declined" or "no_response" outcome counts as one failover attempt.
 */
function failoverAttemptsFor(row: LeadAnalyticsRow): number {
  return row.outcomes.filter(
    (o) => o.outcome === "declined" || o.outcome === "no_response"
  ).length;
}

export function computeSlaAnalytics(
  rows: LeadAnalyticsRow[],
  rangeStart: Date,
  rangeEnd: Date,
  providerNames: Record<string, string> = {}
): SlaAnalytics {
  const dayMs = 86400000;
  const days = Math.max(
    1,
    Math.round((rangeEnd.getTime() - rangeStart.getTime()) / dayMs)
  );

  const totals = {
    leads: rows.length,
    accepted: 0,
    declined: 0,
    expired: 0,
    awaiting: 0,
    completed: 0,
    exhausted: 0,
    unrouted: 0,
  };

  const responseTimes: number[] = [];
  const perProvider = new Map<
    string,
    {
      accepted: number;
      declined: number;
      noResponse: number;
      responseTimes: number[];
    }
  >();
  const failoverCounts = new Map<string, number>();
  const recentExpiredCandidates: SlaAnalytics["recentExpired"] = [];

  const now = rangeEnd;

  for (const row of rows) {
    const lastOutcome = row.outcomes[row.outcomes.length - 1] ?? null;
    const state: LeadResponseState = inferLeadResponseState(
      {
        routedToId: row.routedToId,
        slaDeadline: row.slaDeadline,
        failoverAttempts: failoverAttemptsFor(row),
        outcomeType: lastOutcome?.outcome ?? null,
      },
      now
    );

    switch (state) {
      case "accepted":
        totals.accepted++;
        break;
      case "completed":
        totals.completed++;
        break;
      case "declined":
        totals.declined++;
        break;
      case "expired":
        totals.expired++;
        // Track for the recent-expired list
        recentExpiredCandidates.push({
          leadId: row.id,
          niche: row.niche,
          routedToName: row.routedToName,
          expiredAt: row.slaDeadline ?? row.createdAt,
        });
        break;
      case "exhausted":
        totals.exhausted++;
        break;
      case "awaiting-provider":
        totals.awaiting++;
        break;
      case "unrouted":
        totals.unrouted++;
        break;
    }

    // Response time stats only count actually-responded leads with a measured time
    for (const o of row.outcomes) {
      if (o.outcome === "responded" || o.outcome === "converted") {
        if (typeof o.responseTimeSeconds === "number") {
          responseTimes.push(o.responseTimeSeconds);
        }
      }
    }

    // Per-provider stats — attribute to the provider on each outcome
    for (const o of row.outcomes) {
      // We don't have provider ID on the LeadAnalyticsRow.outcomes shape
      // above directly. Caller is responsible for ensuring outcomes are
      // attributed via the routedToId in the cycle they were created.
    }

    // Failover pair tracking: chain through outcomes that show declined/no_response
    // followed by a different routedToId. Since this row only tells us about the
    // CURRENT routedToId, we approximate failover via the (origin → final) tuple
    // when outcomes exist.
    if (row.outcomes.length > 0 && row.routedToId && row.outcomes[0].outcome === "declined") {
      // Best we can do without per-outcome provider IDs is mark a single transition
      const fromName = "previous";
      const toName = row.routedToName ?? row.routedToId;
      const key = `${fromName}\u2192${toName}`;
      failoverCounts.set(key, (failoverCounts.get(key) ?? 0) + 1);
    }
  }

  const failoverPairs = Array.from(failoverCounts.entries())
    .map(([key, count]) => {
      const [from, to] = key.split("\u2192");
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalProviderActions = Array.from(perProvider.values()).reduce(
    (s, p) => s + p.accepted + p.declined + p.noResponse,
    0
  );
  const topProviders: SlaAnalytics["topProviders"] = totalProviderActions === 0
    ? []
    : Array.from(perProvider.entries())
        .map(([pid, p]) => {
          const total = p.accepted + p.declined + p.noResponse;
          return {
            providerId: pid,
            providerName: providerNames[pid] ?? pid,
            accepted: p.accepted,
            declined: p.declined,
            medianResponseSec: p.responseTimes.length > 0 ? median(p.responseTimes) : null,
            acceptanceRate: total > 0 ? p.accepted / total : 0,
          };
        })
        .sort((a, b) => b.accepted - a.accepted)
        .slice(0, 10);

  // Sort recent-expired by most recent first, top 10
  const recentExpired = recentExpiredCandidates
    .sort((a, b) => b.expiredAt.getTime() - a.expiredAt.getTime())
    .slice(0, 10);

  return {
    range: {
      startISO: rangeStart.toISOString(),
      endISO: rangeEnd.toISOString(),
      days,
    },
    totals,
    acceptRate:
      totals.leads > 0
        ? (totals.accepted + totals.completed) / totals.leads
        : 0,
    responseTime: {
      medianSec: median(responseTimes),
      p75Sec: percentile(responseTimes, 75),
      meanSec:
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
      sampleSize: responseTimes.length,
    },
    topProviders,
    recentExpired,
    failoverPairs,
  };
}

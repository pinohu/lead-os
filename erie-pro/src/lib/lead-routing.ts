// ── Lead Routing Engine ────────────────────────────────────────────────
// Controlled exclusivity lead distribution with SLA timers and failover.

export interface Provider {
  id: string;
  slug: string;
  businessName: string;
  niche: string;
  city: string;
  tier: "primary" | "backup" | "overflow";
  phone?: string;
  email?: string;
  responseTimeAvg: number; // seconds
  conversionRate: number; // 0-1
  satisfactionScore: number; // 0-5
  isActive: boolean;
  slaTimeoutSeconds: number; // max time to respond before failover
}

export interface LeadRouteResult {
  leadId: string;
  niche: string;
  city: string;
  routedTo: Provider | null;
  routeType: "primary" | "failover" | "overflow" | "unmatched";
  timestamp: string;
  slaDeadline: string;
}

export interface ProviderPerformance {
  providerId: string;
  totalLeads: number;
  respondedWithinSla: number;
  converted: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  performanceScore: number; // 0-100
  tier: "gold" | "silver" | "bronze" | "probation";
}

export interface LeadOutcome {
  leadId: string;
  providerId: string;
  outcome: "responded" | "converted" | "no-response" | "declined" | "cancelled";
  responseTimeSeconds?: number;
  satisfactionRating?: number;
  timestamp: string;
}

// ── In-Memory Stores ──────────────────────────────────────────────────

const providers: Provider[] = [
  {
    id: "prov-plumb-001",
    slug: "johnson-plumbing-erie",
    businessName: "Johnson Plumbing & Drain",
    niche: "plumbing",
    city: "erie",
    tier: "primary",
    phone: "(814) 555-0101",
    email: "leads@johnsonplumbing-erie.com",
    responseTimeAvg: 420, // 7 minutes
    conversionRate: 0.68,
    satisfactionScore: 4.7,
    isActive: true,
    slaTimeoutSeconds: 1800, // 30 minutes
  },
  {
    id: "prov-plumb-002",
    slug: "great-lakes-plumbing",
    businessName: "Great Lakes Plumbing Co.",
    niche: "plumbing",
    city: "erie",
    tier: "backup",
    phone: "(814) 555-0202",
    email: "service@greatlakesplumbing.com",
    responseTimeAvg: 900, // 15 minutes
    conversionRate: 0.55,
    satisfactionScore: 4.3,
    isActive: true,
    slaTimeoutSeconds: 3600, // 60 minutes
  },
  {
    id: "prov-hvac-001",
    slug: "erie-comfort-hvac",
    businessName: "Erie Comfort HVAC",
    niche: "hvac",
    city: "erie",
    tier: "primary",
    phone: "(814) 555-0301",
    email: "leads@eriecomforthvac.com",
    responseTimeAvg: 600,
    conversionRate: 0.62,
    satisfactionScore: 4.5,
    isActive: true,
    slaTimeoutSeconds: 1800,
  },
  {
    id: "prov-elec-001",
    slug: "bayfront-electric",
    businessName: "Bayfront Electric Services",
    niche: "electrical",
    city: "erie",
    tier: "primary",
    phone: "(814) 555-0401",
    email: "leads@bayfrontelectric.com",
    responseTimeAvg: 540,
    conversionRate: 0.60,
    satisfactionScore: 4.4,
    isActive: true,
    slaTimeoutSeconds: 2400,
  },
];

const leadResults: Map<string, LeadRouteResult> = new Map();
const leadOutcomes: Map<string, LeadOutcome[]> = new Map();

// ── Helper ────────────────────────────────────────────────────────────

function generateLeadId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `lead-${ts}-${rand}`;
}

// ── Core Functions ────────────────────────────────────────────────────

/**
 * Route a lead to the best available provider.
 * Priority: primary (active + within SLA) -> backup -> overflow -> unmatched.
 */
export function routeLead(
  niche: string,
  city: string,
  leadData: Record<string, unknown>
): LeadRouteResult {
  const leadId = generateLeadId();
  const now = new Date();

  // Find matching providers sorted by tier priority
  const candidates = getProvidersByNiche(niche, city);

  // Try primary first
  const primary = candidates.find(
    (p) => p.tier === "primary" && p.isActive
  );
  if (primary) {
    const deadline = new Date(
      now.getTime() + primary.slaTimeoutSeconds * 1000
    );
    const result: LeadRouteResult = {
      leadId,
      niche,
      city,
      routedTo: primary,
      routeType: "primary",
      timestamp: now.toISOString(),
      slaDeadline: deadline.toISOString(),
    };
    leadResults.set(leadId, result);
    return result;
  }

  // Failover to backup
  const backup = candidates.find(
    (p) => p.tier === "backup" && p.isActive
  );
  if (backup) {
    const deadline = new Date(
      now.getTime() + backup.slaTimeoutSeconds * 1000
    );
    const result: LeadRouteResult = {
      leadId,
      niche,
      city,
      routedTo: backup,
      routeType: "failover",
      timestamp: now.toISOString(),
      slaDeadline: deadline.toISOString(),
    };
    leadResults.set(leadId, result);
    return result;
  }

  // Overflow — any active provider in the niche regardless of city
  const overflow = providers.find(
    (p) => p.niche === niche && p.isActive
  );
  if (overflow) {
    const deadline = new Date(
      now.getTime() + overflow.slaTimeoutSeconds * 1000
    );
    const result: LeadRouteResult = {
      leadId,
      niche,
      city,
      routedTo: overflow,
      routeType: "overflow",
      timestamp: now.toISOString(),
      slaDeadline: deadline.toISOString(),
    };
    leadResults.set(leadId, result);
    return result;
  }

  // Unmatched — no provider available
  const result: LeadRouteResult = {
    leadId,
    niche,
    city,
    routedTo: null,
    routeType: "unmatched",
    timestamp: now.toISOString(),
    slaDeadline: now.toISOString(), // no deadline
  };
  leadResults.set(leadId, result);
  return result;
}

/**
 * Get providers for a niche+city, sorted by tier (primary first).
 */
export function getProvidersByNiche(niche: string, city: string): Provider[] {
  const tierOrder: Record<string, number> = {
    primary: 0,
    backup: 1,
    overflow: 2,
  };

  return providers
    .filter(
      (p) =>
        p.niche === niche &&
        p.city.toLowerCase() === city.toLowerCase()
    )
    .sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
}

/**
 * Record the outcome of a lead (response, conversion, no-response, etc.).
 */
export function recordLeadOutcome(
  leadId: string,
  outcome: LeadOutcome["outcome"],
  details?: {
    responseTimeSeconds?: number;
    satisfactionRating?: number;
  }
): LeadOutcome | null {
  const routeResult = leadResults.get(leadId);
  if (!routeResult || !routeResult.routedTo) return null;

  const record: LeadOutcome = {
    leadId,
    providerId: routeResult.routedTo.id,
    outcome,
    responseTimeSeconds: details?.responseTimeSeconds,
    satisfactionRating: details?.satisfactionRating,
    timestamp: new Date().toISOString(),
  };

  const existing = leadOutcomes.get(routeResult.routedTo.id) ?? [];
  existing.push(record);
  leadOutcomes.set(routeResult.routedTo.id, existing);

  return record;
}

/**
 * Calculate performance metrics for a provider.
 */
export function getProviderPerformance(
  providerId: string
): ProviderPerformance {
  const outcomes = leadOutcomes.get(providerId) ?? [];
  const provider = providers.find((p) => p.id === providerId);
  const slaTimeout = provider?.slaTimeoutSeconds ?? 1800;

  const totalLeads = outcomes.length;
  const respondedWithinSla = outcomes.filter(
    (o) =>
      (o.outcome === "responded" || o.outcome === "converted") &&
      (o.responseTimeSeconds ?? Infinity) <= slaTimeout
  ).length;
  const converted = outcomes.filter(
    (o) => o.outcome === "converted"
  ).length;

  const responseTimes = outcomes
    .filter((o) => o.responseTimeSeconds != null)
    .map((o) => o.responseTimeSeconds!);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const ratings = outcomes
    .filter((o) => o.satisfactionRating != null)
    .map((o) => o.satisfactionRating!);
  const avgSatisfaction =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : provider?.satisfactionScore ?? 0;

  // Performance score: weighted combination
  // 40% SLA compliance, 30% conversion rate, 30% satisfaction
  const slaRate = totalLeads > 0 ? respondedWithinSla / totalLeads : 1;
  const convRate = totalLeads > 0 ? converted / totalLeads : 0;
  const satNorm = avgSatisfaction / 5; // normalize to 0-1
  const performanceScore = Math.round(
    slaRate * 40 + convRate * 30 + satNorm * 30
  );

  // Tier assignment based on score
  let tier: ProviderPerformance["tier"];
  if (performanceScore >= 80) tier = "gold";
  else if (performanceScore >= 60) tier = "silver";
  else if (performanceScore >= 40) tier = "bronze";
  else tier = "probation";

  return {
    providerId,
    totalLeads,
    respondedWithinSla,
    converted,
    avgResponseTime,
    avgSatisfaction,
    performanceScore,
    tier,
  };
}

/**
 * Check whether a provider is currently meeting their SLA.
 * Returns true if their average response time is within SLA timeout.
 */
export function evaluateProviderSla(
  providerId: string
): {
  providerId: string;
  meetsSla: boolean;
  avgResponseTime: number;
  slaTimeout: number;
  slaComplianceRate: number;
} {
  const provider = providers.find((p) => p.id === providerId);
  if (!provider) {
    return {
      providerId,
      meetsSla: false,
      avgResponseTime: 0,
      slaTimeout: 0,
      slaComplianceRate: 0,
    };
  }

  const performance = getProviderPerformance(providerId);
  const slaComplianceRate =
    performance.totalLeads > 0
      ? performance.respondedWithinSla / performance.totalLeads
      : 1; // new providers assumed compliant

  return {
    providerId,
    meetsSla:
      performance.avgResponseTime <= provider.slaTimeoutSeconds &&
      slaComplianceRate >= 0.8,
    avgResponseTime: performance.avgResponseTime,
    slaTimeout: provider.slaTimeoutSeconds,
    slaComplianceRate,
  };
}

/**
 * Get all registered providers (admin utility).
 */
export function getAllProviders(): Provider[] {
  return [...providers];
}

/**
 * Get a specific lead route result by ID.
 */
export function getLeadResult(leadId: string): LeadRouteResult | undefined {
  return leadResults.get(leadId);
}

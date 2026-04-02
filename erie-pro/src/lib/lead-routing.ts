// ── Lead Routing Engine ────────────────────────────────────────────────
// Controlled exclusivity lead distribution with SLA timers and failover.
// Persistent via Prisma/Postgres — all functions are async.

import { prisma } from "@/lib/db";
import type {
  Lead as PrismaLead,
  LeadOutcome as PrismaLeadOutcome,
  Provider as PrismaProvider,
  LeadRouteType,
  LeadOutcomeType,
} from "@/generated/prisma";

// ── Public Interfaces ──────────────────────────────────────────────
// Kept for backward compatibility with the rest of the codebase.

export interface Provider {
  id: string;
  slug: string;
  businessName: string;
  niche: string;
  city: string;
  tier: "primary" | "backup" | "overflow";
  phone?: string;
  email?: string;
  responseTimeAvg: number;
  conversionRate: number;
  satisfactionScore: number;
  isActive: boolean;
  slaTimeoutSeconds: number;
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
  performanceScore: number;
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

// ── Mappers ────────────────────────────────────────────────────────

function providerToRouting(p: PrismaProvider): Provider {
  const totalLeads = p.totalLeads || 1;
  return {
    id: p.id,
    slug: p.slug,
    businessName: p.businessName,
    niche: p.niche,
    city: p.city,
    tier: p.tier as Provider["tier"],
    phone: p.phone,
    email: p.email,
    responseTimeAvg: p.avgResponseTime,
    conversionRate: totalLeads > 0 ? p.convertedLeads / totalLeads : 0,
    satisfactionScore: p.avgRating,
    isActive: p.subscriptionStatus === "active",
    slaTimeoutSeconds: 1800, // default 30 minutes
  };
}

function leadToRouteResult(
  lead: PrismaLead & { routedTo?: PrismaProvider | null }
): LeadRouteResult {
  return {
    leadId: lead.id,
    niche: lead.niche,
    city: lead.city,
    routedTo: lead.routedTo ? providerToRouting(lead.routedTo) : null,
    routeType: lead.routeType as LeadRouteResult["routeType"],
    timestamp: lead.createdAt.toISOString(),
    slaDeadline: lead.slaDeadline?.toISOString() ?? lead.createdAt.toISOString(),
  };
}

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Route a lead to the best available provider.
 * Priority: primary (active) -> backup -> overflow (same city) -> unmatched.
 */
export async function routeLead(
  niche: string,
  city: string,
  leadData: Record<string, unknown>
): Promise<LeadRouteResult> {
  const now = new Date();

  // Find matching providers sorted by tier priority
  // Only route to providers with verified emails AND verified ownership
  const candidates = await prisma.provider.findMany({
    where: {
      niche,
      city: { equals: city, mode: "insensitive" },
      subscriptionStatus: "active",
      emailVerified: true,
      verificationStatus: { in: ["verified", "auto_verified", "admin_approved"] },
    },
    orderBy: { tier: "asc" }, // primary < backup < overflow
  });

  // Determine routing
  let routedToId: string | null = null;
  let routeType: LeadRouteType = "unmatched";
  let slaDeadline = now;
  let routedProvider: PrismaProvider | null = null;

  // Try primary first
  const primary = candidates.find((p) => p.tier === "primary");
  if (primary) {
    routedToId = primary.id;
    routeType = "primary";
    slaDeadline = new Date(now.getTime() + 1800 * 1000); // 30 min
    routedProvider = primary;
  }

  // Failover to backup
  if (!routedToId) {
    const backup = candidates.find((p) => p.tier === "backup");
    if (backup) {
      routedToId = backup.id;
      routeType = "failover";
      slaDeadline = new Date(now.getTime() + 3600 * 1000); // 60 min
      routedProvider = backup;
    }
  }

  // Overflow — any active provider in same niche AND same city (fixed geographic mismatch)
  if (!routedToId) {
    const overflow = candidates.find((p) => p.tier === "overflow");
    if (overflow) {
      routedToId = overflow.id;
      routeType = "overflow";
      slaDeadline = new Date(now.getTime() + 3600 * 1000);
      routedProvider = overflow;
    }
  }

  // Create the lead record
  const lead = await prisma.lead.create({
    data: {
      niche,
      city: city.toLowerCase(),
      firstName: (leadData.firstName as string) ?? null,
      lastName: (leadData.lastName as string) ?? null,
      email: ((leadData.email as string) ?? "").toLowerCase(),
      phone: (leadData.phone as string) ?? null,
      message: (leadData.message as string) ?? null,
      routeType,
      routedToId,
      slaDeadline,
      tcpaConsent: (leadData.tcpaConsent as boolean) ?? false,
      tcpaConsentText: (leadData.tcpaConsentText as string) ?? null,
      tcpaIpAddress: (leadData.tcpaIpAddress as string) ?? null,
      tcpaConsentAt: leadData.tcpaConsent ? now : null,
    },
  });

  // Update provider's lead count if routed
  if (routedToId) {
    await prisma.provider.update({
      where: { id: routedToId },
      data: {
        totalLeads: { increment: 1 },
        lastLeadAt: now,
      },
    });
  }

  return {
    leadId: lead.id,
    niche,
    city,
    routedTo: routedProvider ? providerToRouting(routedProvider) : null,
    routeType: routeType as LeadRouteResult["routeType"],
    timestamp: now.toISOString(),
    slaDeadline: slaDeadline.toISOString(),
  };
}

/**
 * Get providers for a niche+city, sorted by tier (primary first).
 */
export async function getProvidersByNiche(
  niche: string,
  city: string
): Promise<Provider[]> {
  const providers = await prisma.provider.findMany({
    where: {
      niche,
      city: { equals: city, mode: "insensitive" },
    },
    orderBy: { tier: "asc" },
  });
  return providers.map(providerToRouting);
}

/**
 * Record the outcome of a lead (response, conversion, no-response, etc.).
 */
export async function recordLeadOutcome(
  leadId: string,
  outcome: LeadOutcome["outcome"],
  details?: {
    responseTimeSeconds?: number;
    satisfactionRating?: number;
  }
): Promise<LeadOutcome | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { routedTo: true },
  });
  if (!lead || !lead.routedToId) return null;

  // Map hyphenated outcome to enum
  const outcomeMap: Record<string, LeadOutcomeType> = {
    "responded": "responded",
    "converted": "converted",
    "no-response": "no_response",
    "declined": "declined",
    "cancelled": "cancelled",
  };

  const record = await prisma.leadOutcome.create({
    data: {
      leadId,
      providerId: lead.routedToId,
      outcome: outcomeMap[outcome] ?? "responded",
      responseTimeSeconds: details?.responseTimeSeconds,
      satisfactionRating: details?.satisfactionRating,
    },
  });

  // If converted, update provider's converted count
  if (outcome === "converted") {
    await prisma.provider.update({
      where: { id: lead.routedToId },
      data: { convertedLeads: { increment: 1 } },
    });
  }

  return {
    leadId: record.leadId,
    providerId: record.providerId,
    outcome,
    responseTimeSeconds: record.responseTimeSeconds ?? undefined,
    satisfactionRating: record.satisfactionRating ?? undefined,
    timestamp: record.createdAt.toISOString(),
  };
}

/**
 * Calculate performance metrics for a provider.
 */
export async function getProviderPerformance(
  providerId: string
): Promise<ProviderPerformance> {
  const [provider, outcomes] = await Promise.all([
    prisma.provider.findUnique({ where: { id: providerId } }),
    prisma.leadOutcome.findMany({ where: { providerId } }),
  ]);

  const slaTimeout = 1800; // 30 min default
  const totalLeads = outcomes.length;

  const respondedWithinSla = outcomes.filter(
    (o) =>
      (o.outcome === "responded" || o.outcome === "converted") &&
      (o.responseTimeSeconds ?? Infinity) <= slaTimeout
  ).length;

  const converted = outcomes.filter((o) => o.outcome === "converted").length;

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
      : provider?.avgRating ?? 0;

  const slaRate = totalLeads > 0 ? respondedWithinSla / totalLeads : 1;
  const convRate = totalLeads > 0 ? converted / totalLeads : 0;
  const satNorm = avgSatisfaction / 5;
  const performanceScore = Math.round(slaRate * 40 + convRate * 30 + satNorm * 30);

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
 */
export async function evaluateProviderSla(
  providerId: string
): Promise<{
  providerId: string;
  meetsSla: boolean;
  avgResponseTime: number;
  slaTimeout: number;
  slaComplianceRate: number;
}> {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) {
    return { providerId, meetsSla: false, avgResponseTime: 0, slaTimeout: 0, slaComplianceRate: 0 };
  }

  const performance = await getProviderPerformance(providerId);
  const slaTimeout = 1800;
  const slaComplianceRate =
    performance.totalLeads > 0
      ? performance.respondedWithinSla / performance.totalLeads
      : 1;

  return {
    providerId,
    meetsSla: performance.avgResponseTime <= slaTimeout && slaComplianceRate >= 0.8,
    avgResponseTime: performance.avgResponseTime,
    slaTimeout,
    slaComplianceRate,
  };
}

/**
 * Get all registered providers (admin utility).
 */
export async function getAllProviders(): Promise<Provider[]> {
  const providers = await prisma.provider.findMany();
  return providers.map(providerToRouting);
}

/**
 * Get a specific lead route result by ID.
 */
export async function getLeadResult(leadId: string): Promise<LeadRouteResult | undefined> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { routedTo: true },
  });
  if (!lead) return undefined;
  return leadToRouteResult(lead);
}

/**
 * Count banked (unmatched) leads for a given niche.
 */
export async function getBankedLeadsByNiche(niche: string): Promise<number> {
  return prisma.lead.count({
    where: { niche, routeType: "unmatched" },
  });
}

/**
 * Get banked lead counts for ALL niches.
 */
export async function getAllBankedLeadCounts(): Promise<Record<string, number>> {
  const results = await prisma.lead.groupBy({
    by: ["niche"],
    where: { routeType: "unmatched" },
    _count: true,
  });

  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.niche] = r._count;
  }
  return counts;
}

/**
 * Get unmatched lead records for a niche (for pay-per-lead flow).
 */
export async function getUnmatchedLeadsForNiche(niche: string): Promise<LeadRouteResult[]> {
  const leads = await prisma.lead.findMany({
    where: { niche, routeType: "unmatched" },
    include: { routedTo: true },
    orderBy: { createdAt: "desc" },
  });
  return leads.map(leadToRouteResult);
}

/**
 * Mark an unmatched lead as purchased (pay-per-lead).
 */
export async function assignLeadToBuyer(
  leadId: string,
  buyerEmail: string
): Promise<LeadRouteResult | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { routedTo: true },
  });
  if (!lead || lead.routeType !== "unmatched") return null;

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: { routeType: "overflow" },
    include: { routedTo: true },
  });

  return leadToRouteResult(updated);
}

/**
 * Re-route banked leads to a newly activated provider.
 * Called when a provider claims a previously unclaimed territory.
 */
export async function deliverBankedLeads(
  niche: string,
  city: string,
  providerId: string
): Promise<number> {
  const result = await prisma.lead.updateMany({
    where: {
      niche,
      city: { equals: city, mode: "insensitive" },
      routeType: "unmatched",
    },
    data: {
      routedToId: providerId,
      routeType: "primary",
      slaDeadline: new Date(Date.now() + 1800 * 1000),
    },
  });
  return result.count;
}

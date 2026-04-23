import type {
  MarketplaceLead,
  BuyerAccount,
  Temperature,
  LeadOutcome,
  MarketplaceLeadFilters,
} from "./marketplace-store.ts";
import {
  publishLead as storeLead,
  getMarketplaceLead,
  listMarketplaceLeads,
  claimLead as storeClaimLead,
  updateLeadOutcome as storeUpdateLeadOutcome,
  getBuyer,
  updateBuyer,
} from "./marketplace-store.ts";
import { getLeadRecord } from "./runtime-store.ts";

export interface LeadPricing {
  niche: string;
  temperature: Temperature;
  basePrice: number;
  qualityMultiplier: number;
}

const BASE_PRICES: Record<Temperature, number> = {
  cold: 2500,
  warm: 5000,
  hot: 10000,
  burning: 20000,
};

const NICHE_MULTIPLIERS: Record<string, number> = {
  "re-syndication": 3.0,
  "immigration-law": 2.5,
  "construction": 2.0,
  "franchise": 2.0,
  "staffing": 1.5,
};

function generateId(): string {
  return `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function calculateLeadPrice(niche: string, temperature: Temperature, score: number): number {
  const base = BASE_PRICES[temperature];
  const nicheMultiplier = NICHE_MULTIPLIERS[niche] ?? 1.0;
  const qualityMultiplier = (score / 100) * 1.5 + 0.5;
  return Math.round(base * nicheMultiplier * qualityMultiplier);
}

export function anonymizeLeadSummary(firstName: string, niche: string, score: number, service: string): string {
  const initial = firstName ? firstName.charAt(0).toUpperCase() : "A";
  const qualityLabel = score >= 80 ? "high-quality" : score >= 50 ? "qualified" : "early-stage";
  return `${qualityLabel} ${niche} lead (${initial}***) interested in ${service} services — score ${score}/100`;
}

export async function publishLeadToMarketplace(
  leadKey: string,
  tenantId: string,
  leadData: {
    firstName?: string;
    niche: string;
    score: number;
    temperature: Temperature;
    city?: string;
    state?: string;
    industry?: string;
    service?: string;
    contactFields?: string[];
  },
): Promise<MarketplaceLead> {
  const price = calculateLeadPrice(leadData.niche, leadData.temperature, leadData.score);
  const summary = anonymizeLeadSummary(
    leadData.firstName ?? "",
    leadData.niche,
    leadData.score,
    leadData.service ?? leadData.niche,
  );

  const now = new Date().toISOString();
  const lead: MarketplaceLead = {
    id: generateId(),
    tenantId,
    leadKey,
    niche: leadData.niche,
    qualityScore: leadData.score,
    temperature: leadData.temperature,
    city: leadData.city,
    state: leadData.state,
    industry: leadData.industry ?? leadData.niche,
    summary,
    contactFields: leadData.contactFields ?? ["email"],
    price,
    status: "available",
    outcomeReported: false,
    createdAt: now,
    updatedAt: now,
  };

  return storeLead(lead);
}

export async function claimLeadForBuyer(
  leadId: string,
  buyerId: string,
): Promise<{ lead: MarketplaceLead; revealedContact: Record<string, string> }> {
  const lead = await getMarketplaceLead(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }
  if (lead.status !== "available") {
    throw new Error(`Lead is not available — current status: ${lead.status}`);
  }

  const buyer = await getBuyer(buyerId);
  if (!buyer) {
    throw new Error("Buyer account not found");
  }
  if (buyer.status !== "active") {
    throw new Error("Buyer account is suspended");
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  if (buyer.totalSpent + lead.price > buyer.monthlyBudget) {
    throw new Error("Claim would exceed monthly budget");
  }

  const claimed = await storeClaimLead(leadId, buyerId);
  if (!claimed) {
    throw new Error("Failed to claim lead");
  }

  buyer.totalSpent += lead.price;
  buyer.leadsPurchased += 1;
  await updateBuyer(buyer);

  const revealedContact: Record<string, string> = {};
  const sourceRecord = claimed.leadKey ? await getLeadRecord(claimed.leadKey) : undefined;
  if (sourceRecord) {
    const fieldMap: Record<string, string | undefined> = {
      email: sourceRecord.email,
      phone: sourceRecord.phone,
      firstName: sourceRecord.firstName,
      lastName: sourceRecord.lastName,
      company: sourceRecord.company,
    };
    for (const field of lead.contactFields) {
      revealedContact[field] = fieldMap[field] ?? "";
    }
  }

  return { lead: claimed, revealedContact };
}

export async function reportLeadOutcome(
  leadId: string,
  buyerId: string,
  outcome: LeadOutcome,
): Promise<MarketplaceLead> {
  const lead = await getMarketplaceLead(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }
  if (lead.claimedBy !== buyerId) {
    throw new Error("Only the claiming buyer can report an outcome");
  }
  if (lead.outcomeReported) {
    throw new Error("Outcome has already been reported for this lead");
  }

  const updated = await storeUpdateLeadOutcome(leadId, outcome);
  if (!updated) {
    throw new Error("Failed to update lead outcome");
  }

  return updated;
}

export async function getRevenueByNiche(since?: string): Promise<Record<string, { revenue: number; count: number }>> {
  const filters: MarketplaceLeadFilters = { status: "sold" as const, limit: 100 };
  const { leads } = await listMarketplaceLeads(filters);

  const sinceDate = since ? new Date(since) : null;

  const byNiche: Record<string, { revenue: number; count: number }> = {};
  for (const lead of leads) {
    if (sinceDate && new Date(lead.soldAt ?? lead.createdAt) < sinceDate) continue;
    if (!byNiche[lead.niche]) {
      byNiche[lead.niche] = { revenue: 0, count: 0 };
    }
    byNiche[lead.niche].revenue += lead.price;
    byNiche[lead.niche].count += 1;
  }

  return byNiche;
}

export async function getMarketplaceStats(): Promise<{
  totalLeads: number;
  available: number;
  claimed: number;
  sold: number;
  totalRevenue: number;
  avgPrice: number;
  topNiches: Array<{ niche: string; revenue: number; count: number }>;
}> {
  const { leads: allLeads, total: totalLeads } = await listMarketplaceLeads({ limit: 100 });

  let available = 0;
  let claimed = 0;
  let sold = 0;
  let totalRevenue = 0;
  let soldCount = 0;
  let totalPrice = 0;
  const nicheRevenue: Record<string, { revenue: number; count: number }> = {};

  for (const lead of allLeads) {
    if (lead.status === "available") available++;
    if (lead.status === "claimed") claimed++;
    if (lead.status === "sold") {
      sold++;
      totalRevenue += lead.price;
    }
    totalPrice += lead.price;
    soldCount++;

    if (!nicheRevenue[lead.niche]) {
      nicheRevenue[lead.niche] = { revenue: 0, count: 0 };
    }
    if (lead.status === "sold" || lead.status === "claimed") {
      nicheRevenue[lead.niche].revenue += lead.price;
      nicheRevenue[lead.niche].count += 1;
    }
  }

  const topNiches = Object.entries(nicheRevenue)
    .map(([niche, data]) => ({ niche, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalLeads,
    available,
    claimed,
    sold,
    totalRevenue,
    avgPrice: soldCount > 0 ? Math.round(totalPrice / soldCount) : 0,
    topNiches,
  };
}

import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadValuation {
  leadId: string;
  niche: string;
  qualityScore: number;
  basePrice: number;
  adjustedPrice: number;
  exclusivityMultiplier: number;
  finalPrice: number;
  currency: string;
  computedAt: string;
}

export interface BuyerPreferences {
  buyerId: string;
  niches: string[];
  locations: string[];
  maxBudgetPerLead: number;
  dailyCapacity: number;
  currentDailyCount: number;
}

export interface BuyerMatch {
  buyerId: string;
  matchScore: number;
  matchReasons: string[];
  priceOffered: number;
}

export interface AuctionResult {
  leadId: string;
  winnerId: string | null;
  winningBid: number;
  reservePrice: number;
  reserveMet: boolean;
  bidCount: number;
  bids: { buyerId: string; amount: number }[];
  completedAt: string;
}

export interface AffiliateOffer {
  offerId: string;
  name: string;
  niche: string;
  payoutPerConversion: number;
  conversionType: string;
  url: string;
  relevanceScore: number;
}

export interface ReferralLink {
  referralId: string;
  tenantId: string;
  campaign: string;
  url: string;
  createdAt: string;
}

export interface ReferralCommission {
  referralId: string;
  conversionValue: number;
  commissionRate: number;
  commissionAmount: number;
  tier: "base" | "volume" | "vip";
}

export interface ArbitrageAnalysis {
  niche: string;
  service: string;
  estimatedCost: number;
  estimatedPrice: number;
  margin: number;
  marginPercent: number;
  viable: boolean;
}

export interface RevenueEvent {
  id: string;
  tenantId: string;
  source: "leads" | "affiliate" | "arbitrage" | "saas" | "referral";
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  recordedAt: string;
}

export interface RevenueReport {
  tenantId: string;
  period: string;
  totalRevenue: number;
  breakdown: Record<string, number>;
  eventCount: number;
  events: RevenueEvent[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Niche Pricing
// ---------------------------------------------------------------------------

const NICHE_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  plumber: { min: 50, max: 150 },
  electrician: { min: 45, max: 130 },
  hvac: { min: 60, max: 160 },
  lawyer: { min: 100, max: 300 },
  attorney: { min: 100, max: 300 },
  "real-estate": { min: 75, max: 200 },
  realtor: { min: 75, max: 200 },
  dentist: { min: 40, max: 120 },
  roofing: { min: 55, max: 170 },
  "solar-installer": { min: 80, max: 250 },
  insurance: { min: 30, max: 90 },
  "financial-advisor": { min: 70, max: 220 },
  chiropractor: { min: 35, max: 100 },
  landscaping: { min: 25, max: 80 },
  "pest-control": { min: 20, max: 60 },
};

const DEFAULT_PRICE_RANGE = { min: 30, max: 100 };

// ---------------------------------------------------------------------------
// Affiliate Offer Catalog (in-memory)
// ---------------------------------------------------------------------------

const AFFILIATE_OFFERS: AffiliateOffer[] = [
  { offerId: "aff-001", name: "ServiceTitan CRM", niche: "plumber", payoutPerConversion: 150, conversionType: "trial-signup", url: "https://affiliate.example.com/servicetitan", relevanceScore: 0 },
  { offerId: "aff-002", name: "ServiceTitan CRM", niche: "hvac", payoutPerConversion: 150, conversionType: "trial-signup", url: "https://affiliate.example.com/servicetitan-hvac", relevanceScore: 0 },
  { offerId: "aff-003", name: "Clio Legal Suite", niche: "lawyer", payoutPerConversion: 200, conversionType: "demo-booked", url: "https://affiliate.example.com/clio", relevanceScore: 0 },
  { offerId: "aff-004", name: "Clio Legal Suite", niche: "attorney", payoutPerConversion: 200, conversionType: "demo-booked", url: "https://affiliate.example.com/clio", relevanceScore: 0 },
  { offerId: "aff-005", name: "Zillow Premier Agent", niche: "real-estate", payoutPerConversion: 100, conversionType: "signup", url: "https://affiliate.example.com/zillow", relevanceScore: 0 },
  { offerId: "aff-006", name: "Zillow Premier Agent", niche: "realtor", payoutPerConversion: 100, conversionType: "signup", url: "https://affiliate.example.com/zillow", relevanceScore: 0 },
  { offerId: "aff-007", name: "Jobber", niche: "landscaping", payoutPerConversion: 80, conversionType: "trial-signup", url: "https://affiliate.example.com/jobber", relevanceScore: 0 },
  { offerId: "aff-008", name: "Housecall Pro", niche: "electrician", payoutPerConversion: 120, conversionType: "trial-signup", url: "https://affiliate.example.com/housecall", relevanceScore: 0 },
  { offerId: "aff-009", name: "SmileSnap", niche: "dentist", payoutPerConversion: 90, conversionType: "trial-signup", url: "https://affiliate.example.com/smilesnap", relevanceScore: 0 },
  { offerId: "aff-010", name: "SolarNexus", niche: "solar-installer", payoutPerConversion: 175, conversionType: "demo-booked", url: "https://affiliate.example.com/solarnexus", relevanceScore: 0 },
];

// ---------------------------------------------------------------------------
// Service Cost & Price Estimates (arbitrage)
// ---------------------------------------------------------------------------

const SERVICE_COSTS: Record<string, Record<string, number>> = {
  plumber: { "website-build": 300, seo: 200, "google-ads": 500, "social-media": 150, crm: 50 },
  lawyer: { "website-build": 500, seo: 350, "google-ads": 800, "social-media": 250, crm: 75 },
  "real-estate": { "website-build": 400, seo: 250, "google-ads": 600, "social-media": 200, crm: 60 },
  dentist: { "website-build": 350, seo: 200, "google-ads": 450, "social-media": 175, crm: 50 },
  hvac: { "website-build": 300, seo: 200, "google-ads": 550, "social-media": 150, crm: 50 },
};

const SERVICE_PRICES: Record<string, Record<string, number>> = {
  plumber: { "website-build": 1500, seo: 800, "google-ads": 1200, "social-media": 600, crm: 200 },
  lawyer: { "website-build": 3000, seo: 1500, "google-ads": 2500, "social-media": 1000, crm: 300 },
  "real-estate": { "website-build": 2000, seo: 1000, "google-ads": 1800, "social-media": 800, crm: 250 },
  dentist: { "website-build": 1800, seo: 900, "google-ads": 1100, "social-media": 700, crm: 200 },
  hvac: { "website-build": 1500, seo: 800, "google-ads": 1300, "social-media": 600, crm: 200 },
};

const DEFAULT_COST: Record<string, number> = { "website-build": 350, seo: 250, "google-ads": 600, "social-media": 175, crm: 55 };
const DEFAULT_PRICE: Record<string, number> = { "website-build": 1800, seo: 900, "google-ads": 1400, "social-media": 700, crm: 225 };

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const revenueStore = new Map<string, RevenueEvent>();
const referralLinkStore = new Map<string, ReferralLink>();

let revenueCounter = 0;
let referralCounter = 0;

let schemaReady: Promise<void> | null = null;

async function ensureMonetizationSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_revenue_events (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          source TEXT NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          metadata JSONB NOT NULL DEFAULT '{}',
          recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_revenue_events_tenant ON lead_os_revenue_events(tenant_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_revenue_events_source ON lead_os_revenue_events(source)
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Pay-Per-Lead
// ---------------------------------------------------------------------------

export function calculateLeadValue(
  lead: { id: string; location?: string; exclusivity?: boolean; metadata?: Record<string, unknown> },
  niche: string,
  qualityScore: number,
): LeadValuation {
  const normalizedNiche = niche.toLowerCase().trim();
  const range = NICHE_PRICE_RANGES[normalizedNiche] ?? DEFAULT_PRICE_RANGE;
  const clampedScore = Math.max(0, Math.min(100, qualityScore));

  const basePrice = range.min + ((range.max - range.min) * (clampedScore / 100));
  const exclusivityMultiplier = lead.exclusivity ? 1.5 : 1.0;
  const adjustedPrice = basePrice * exclusivityMultiplier;
  const finalPrice = Math.round(adjustedPrice * 100) / 100;

  return {
    leadId: lead.id,
    niche: normalizedNiche,
    qualityScore: clampedScore,
    basePrice: Math.round(basePrice * 100) / 100,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100,
    exclusivityMultiplier,
    finalPrice,
    currency: "USD",
    computedAt: new Date().toISOString(),
  };
}

export function routeLeadToBuyer(
  lead: { id: string; niche: string; location?: string; qualityScore?: number },
  buyerPreferences: BuyerPreferences[],
): BuyerMatch | null {
  const scored: BuyerMatch[] = [];

  for (const buyer of buyerPreferences) {
    const reasons: string[] = [];
    let score = 0;

    const nicheMatch = buyer.niches.some((n) => n.toLowerCase() === lead.niche.toLowerCase());
    if (nicheMatch) {
      score += 40;
      reasons.push("niche-match");
    }

    if (lead.location && buyer.locations.length > 0) {
      const locationMatch = buyer.locations.some((l) => l.toLowerCase() === lead.location!.toLowerCase());
      if (locationMatch) {
        score += 30;
        reasons.push("location-match");
      }
    }

    const hasCapacity = buyer.currentDailyCount < buyer.dailyCapacity;
    if (hasCapacity) {
      score += 20;
      reasons.push("has-capacity");
    }

    const withinBudget = buyer.maxBudgetPerLead > 0;
    if (withinBudget) {
      score += 10;
      reasons.push("within-budget");
    }

    if (score > 0 && nicheMatch && hasCapacity) {
      scored.push({
        buyerId: buyer.buyerId,
        matchScore: score,
        matchReasons: reasons,
        priceOffered: buyer.maxBudgetPerLead,
      });
    }
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => b.matchScore - a.matchScore || b.priceOffered - a.priceOffered);
  return scored[0];
}

export function auctionLead(
  lead: { id: string; niche: string; reservePrice: number },
  buyers: { buyerId: string; bidAmount: number }[],
): AuctionResult {
  const validBids = buyers
    .filter((b) => b.bidAmount > 0)
    .sort((a, b) => b.bidAmount - a.bidAmount);

  const topBid = validBids[0] ?? null;
  const reserveMet = topBid !== null && topBid.bidAmount >= lead.reservePrice;

  return {
    leadId: lead.id,
    winnerId: reserveMet ? topBid.buyerId : null,
    winningBid: reserveMet ? topBid.bidAmount : 0,
    reservePrice: lead.reservePrice,
    reserveMet,
    bidCount: validBids.length,
    bids: validBids.map((b) => ({ buyerId: b.buyerId, amount: b.bidAmount })),
    completedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Affiliate & Referral
// ---------------------------------------------------------------------------

export function matchAffiliateOffer(
  lead: { niche: string; metadata?: Record<string, unknown> },
  niche: string,
): AffiliateOffer[] {
  const normalizedNiche = niche.toLowerCase().trim();
  const matches = AFFILIATE_OFFERS
    .filter((o) => o.niche === normalizedNiche)
    .map((o) => ({
      ...o,
      relevanceScore: computeAffiliateRelevance(lead, o),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return matches;
}

function computeAffiliateRelevance(
  lead: { niche: string; metadata?: Record<string, unknown> },
  offer: AffiliateOffer,
): number {
  let score = 50;
  if (lead.niche.toLowerCase() === offer.niche) score += 30;
  if (lead.metadata?.budget) score += 10;
  if (lead.metadata?.company) score += 10;
  return Math.min(score, 100);
}

export function generateReferralLink(tenantId: string, campaign: string): ReferralLink {
  referralCounter += 1;
  const referralId = `ref-${tenantId}-${referralCounter}-${Date.now()}`;
  const url = `https://app.lead-os.com/r/${referralId}?utm_campaign=${encodeURIComponent(campaign)}`;

  const link: ReferralLink = {
    referralId,
    tenantId,
    campaign,
    url,
    createdAt: new Date().toISOString(),
  };

  referralLinkStore.set(referralId, link);
  return link;
}

const COMMISSION_TIERS = {
  base: { rate: 0.10, threshold: 0 },
  volume: { rate: 0.15, threshold: 10000 },
  vip: { rate: 0.20, threshold: 50000 },
} as const;

export function calculateReferralCommission(
  referralId: string,
  conversionValue: number,
  cumulativeReferralRevenue: number = 0,
): ReferralCommission {
  let tier: "base" | "volume" | "vip" = "base";
  let rate: number = COMMISSION_TIERS.base.rate;

  if (cumulativeReferralRevenue >= COMMISSION_TIERS.vip.threshold) {
    tier = "vip";
    rate = COMMISSION_TIERS.vip.rate;
  } else if (cumulativeReferralRevenue >= COMMISSION_TIERS.volume.threshold) {
    tier = "volume";
    rate = COMMISSION_TIERS.volume.rate;
  }

  const commissionAmount = Math.round(conversionValue * rate * 100) / 100;

  return {
    referralId,
    conversionValue,
    commissionRate: rate,
    commissionAmount,
    tier,
  };
}

// ---------------------------------------------------------------------------
// Service Arbitrage
// ---------------------------------------------------------------------------

export function estimateServiceCost(niche: string, service: string): number {
  const normalizedNiche = niche.toLowerCase().trim();
  const normalizedService = service.toLowerCase().trim();
  const nicheCosts = SERVICE_COSTS[normalizedNiche];
  if (nicheCosts && normalizedService in nicheCosts) {
    return nicheCosts[normalizedService];
  }
  return DEFAULT_COST[normalizedService] ?? 500;
}

export function estimateServicePrice(niche: string, service: string, market: string = "us"): number {
  const normalizedNiche = niche.toLowerCase().trim();
  const normalizedService = service.toLowerCase().trim();
  const nichePrices = SERVICE_PRICES[normalizedNiche];
  let price: number;
  if (nichePrices && normalizedService in nichePrices) {
    price = nichePrices[normalizedService];
  } else {
    price = DEFAULT_PRICE[normalizedService] ?? 1500;
  }

  const marketMultipliers: Record<string, number> = {
    us: 1.0,
    uk: 0.9,
    ca: 0.85,
    au: 0.95,
  };
  const multiplier = marketMultipliers[market.toLowerCase()] ?? 1.0;
  return Math.round(price * multiplier * 100) / 100;
}

export function calculateArbitrageMargin(cost: number, price: number): ArbitrageAnalysis {
  const margin = price - cost;
  const marginPercent = cost > 0 ? Math.round((margin / price) * 10000) / 100 : 0;
  const viable = marginPercent >= 30;

  return {
    niche: "",
    service: "",
    estimatedCost: cost,
    estimatedPrice: price,
    margin,
    marginPercent,
    viable,
  };
}

// ---------------------------------------------------------------------------
// Revenue Tracking
// ---------------------------------------------------------------------------

export async function recordRevenue(
  tenantId: string,
  source: RevenueEvent["source"],
  amount: number,
  metadata: Record<string, unknown> = {},
): Promise<RevenueEvent> {
  revenueCounter += 1;
  const id = `rev-${tenantId}-${revenueCounter}-${Date.now()}`;
  const event: RevenueEvent = {
    id,
    tenantId,
    source,
    amount: Math.round(amount * 100) / 100,
    currency: "USD",
    metadata,
    recordedAt: new Date().toISOString(),
  };

  revenueStore.set(id, event);

  try {
    await ensureMonetizationSchema();
    const pool = getPool();
    if (pool) {
      await pool.query(
        `INSERT INTO lead_os_revenue_events (id, tenant_id, source, amount, currency, metadata, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [event.id, event.tenantId, event.source, event.amount, event.currency, JSON.stringify(event.metadata), event.recordedAt],
      );
    }
  } catch {
    // In-memory store is the fallback
  }

  return event;
}

export function getRevenueReport(tenantId: string, period: string): RevenueReport {
  const events: RevenueEvent[] = [];
  const breakdown: Record<string, number> = {};
  let totalRevenue = 0;

  for (const event of revenueStore.values()) {
    if (event.tenantId !== tenantId) continue;
    if (!event.recordedAt.startsWith(period)) continue;

    events.push(event);
    totalRevenue += event.amount;
    breakdown[event.source] = (breakdown[event.source] ?? 0) + event.amount;
  }

  return {
    tenantId,
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    breakdown,
    eventCount: events.length,
    events,
    generatedAt: new Date().toISOString(),
  };
}

export function getRevenueByNiche(period: string): Record<string, number> {
  const nicheRevenue: Record<string, number> = {};

  for (const event of revenueStore.values()) {
    if (!event.recordedAt.startsWith(period)) continue;
    const niche = (event.metadata.niche as string) ?? "unknown";
    nicheRevenue[niche] = (nicheRevenue[niche] ?? 0) + event.amount;
  }

  return nicheRevenue;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  revenueStore.clear();
  referralLinkStore.clear();
  revenueCounter = 0;
  referralCounter = 0;
}

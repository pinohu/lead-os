import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupplyDemandAnalysis {
  niche: string;
  leadSupply: number;
  buyerDemand: number;
  ratio: number;
  status: "oversupply" | "balanced" | "undersupply";
  priceDirection: "increase" | "stable" | "decrease";
}

export interface ScarcityOpportunity {
  niche: string;
  demandSupplyGap: number;
  currentPrice: number;
  suggestedPrice: number;
  priceIncreasePct: number;
  urgencyLevel: "high" | "medium" | "low";
  rationale: string;
}

export interface BuyerAcquisitionPlan {
  niche: string;
  strategies: BuyerAcquisitionStrategy[];
  estimatedBuyerGain: number;
  timeframe: string;
}

export interface BuyerAcquisitionStrategy {
  channel: string;
  tactic: string;
  effort: "low" | "medium" | "high";
  expectedConversion: number;
  priority: number;
}

export interface DynamicPricingResult {
  niche: string;
  currentPrice: number;
  optimizedPrice: number;
  changePercent: number;
  rationale: string;
  expectedRevenueChange: number;
}

export interface RankedBuyer {
  buyerId: string;
  totalSpent: number;
  leadsPurchased: number;
  avgSpendPerLead: number;
  repeatRate: number;
  valueScore: number;
  tier: "platinum" | "gold" | "silver" | "bronze";
}

export interface LeadScarcitySignal {
  niche: string;
  availableLeads: number;
  claimedLast24h: number;
  avgTimeToClaimHours: number;
  urgencyMessage: string;
  scarcityLevel: "critical" | "high" | "moderate" | "low";
}

export interface MarketplaceHealthScore {
  overallScore: number;
  liquidity: number;
  buyerChurnRate: number;
  sellerChurnRate: number;
  avgTimeToSaleHours: number;
  repeatBuyerRate: number;
  growthRate: number;
  nicheCount: number;
  activeBuyers: number;
  activeLeads: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const supplyStore = new Map<string, { supply: number; demand: number; avgPrice: number }>();
const buyerActivityStore = new Map<string, { totalSpent: number; leadsPurchased: number; lastPurchase: string }>();
const claimLogStore: Array<{ niche: string; claimedAt: string; timeToClaimHours: number }> = [];

let schemaReady: Promise<void> | null = null;

async function ensureMarketplaceGrowthSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_marketplace_supply_demand (
          niche TEXT PRIMARY KEY,
          supply INTEGER NOT NULL DEFAULT 0,
          demand INTEGER NOT NULL DEFAULT 0,
          avg_price NUMERIC(10,2) NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Data Ingestion
// ---------------------------------------------------------------------------

export function recordSupplyDemand(niche: string, supply: number, demand: number, avgPrice: number): void {
  supplyStore.set(niche, { supply, demand, avgPrice });
}

export function recordBuyerActivity(buyerId: string, spent: number, leadCount: number): void {
  const existing = buyerActivityStore.get(buyerId) ?? { totalSpent: 0, leadsPurchased: 0, lastPurchase: "" };
  existing.totalSpent += spent;
  existing.leadsPurchased += leadCount;
  existing.lastPurchase = new Date().toISOString();
  buyerActivityStore.set(buyerId, existing);
}

export function recordClaimEvent(niche: string, timeToClaimHours: number): void {
  claimLogStore.push({
    niche,
    claimedAt: new Date().toISOString(),
    timeToClaimHours,
  });
}

// ---------------------------------------------------------------------------
// Supply & Demand Analysis
// ---------------------------------------------------------------------------

export function analyzeSupplyDemand(tenantId: string): SupplyDemandAnalysis[] {
  const results: SupplyDemandAnalysis[] = [];

  for (const [niche, data] of supplyStore) {
    const ratio = data.demand > 0 ? Math.round((data.supply / data.demand) * 100) / 100 : data.supply > 0 ? 999 : 0;

    let status: SupplyDemandAnalysis["status"];
    let priceDirection: SupplyDemandAnalysis["priceDirection"];

    if (ratio > 1.5) {
      status = "oversupply";
      priceDirection = "decrease";
    } else if (ratio < 0.7) {
      status = "undersupply";
      priceDirection = "increase";
    } else {
      status = "balanced";
      priceDirection = "stable";
    }

    results.push({
      niche,
      leadSupply: data.supply,
      buyerDemand: data.demand,
      ratio,
      status,
      priceDirection,
    });
  }

  return results.sort((a, b) => a.ratio - b.ratio);
}

// ---------------------------------------------------------------------------
// Scarcity Opportunities
// ---------------------------------------------------------------------------

export function identifyScarcityOpportunities(): ScarcityOpportunity[] {
  const opportunities: ScarcityOpportunity[] = [];

  for (const [niche, data] of supplyStore) {
    if (data.demand <= data.supply) continue;

    const gap = data.demand - data.supply;
    const gapRatio = data.supply > 0 ? gap / data.supply : gap;

    let suggestedIncrease: number;
    let urgencyLevel: ScarcityOpportunity["urgencyLevel"];

    if (gapRatio > 2) {
      suggestedIncrease = 0.3;
      urgencyLevel = "high";
    } else if (gapRatio > 1) {
      suggestedIncrease = 0.2;
      urgencyLevel = "medium";
    } else {
      suggestedIncrease = 0.1;
      urgencyLevel = "low";
    }

    const suggestedPrice = Math.round(data.avgPrice * (1 + suggestedIncrease) * 100) / 100;

    opportunities.push({
      niche,
      demandSupplyGap: gap,
      currentPrice: data.avgPrice,
      suggestedPrice,
      priceIncreasePct: Math.round(suggestedIncrease * 100),
      urgencyLevel,
      rationale: `Demand exceeds supply by ${gap} leads. Gap ratio: ${Math.round(gapRatio * 100) / 100}x. Market supports ${Math.round(suggestedIncrease * 100)}% price increase.`,
    });
  }

  return opportunities.sort((a, b) => b.demandSupplyGap - a.demandSupplyGap);
}

// ---------------------------------------------------------------------------
// Buyer Acquisition Plan
// ---------------------------------------------------------------------------

const BUYER_ACQUISITION_CHANNELS: BuyerAcquisitionStrategy[] = [
  { channel: "linkedin", tactic: "Target decision-makers in the niche with InMail campaigns", effort: "medium", expectedConversion: 0.03, priority: 1 },
  { channel: "content-marketing", tactic: "Publish lead quality case studies and ROI calculators", effort: "high", expectedConversion: 0.05, priority: 2 },
  { channel: "partnerships", tactic: "Partner with CRM vendors and industry associations", effort: "high", expectedConversion: 0.08, priority: 3 },
  { channel: "referral", tactic: "Offer credits to existing buyers who refer new buyers", effort: "low", expectedConversion: 0.12, priority: 4 },
  { channel: "cold-email", tactic: "Targeted outreach to businesses actively buying leads", effort: "medium", expectedConversion: 0.02, priority: 5 },
  { channel: "webinar", tactic: "Host 'How to Buy Leads Profitably' webinars for the niche", effort: "medium", expectedConversion: 0.06, priority: 6 },
  { channel: "marketplace-seo", tactic: "Optimize marketplace pages for buyer search queries", effort: "high", expectedConversion: 0.04, priority: 7 },
];

export function generateBuyerAcquisitionPlan(niche: string): BuyerAcquisitionPlan {
  const supplyData = supplyStore.get(niche);
  const currentDemand = supplyData?.demand ?? 0;
  const currentSupply = supplyData?.supply ?? 0;

  const buyerGap = Math.max(0, currentSupply - currentDemand);
  const targetBuyers = Math.max(5, Math.ceil(buyerGap * 0.5));

  const strategies = BUYER_ACQUISITION_CHANNELS.map((s) => ({
    ...s,
    tactic: s.tactic.replace("the niche", niche),
  }));

  return {
    niche,
    strategies,
    estimatedBuyerGain: targetBuyers,
    timeframe: buyerGap > 20 ? "90 days" : "60 days",
  };
}

// ---------------------------------------------------------------------------
// Dynamic Pricing
// ---------------------------------------------------------------------------

export function optimizeDynamicPricing(niche: string): DynamicPricingResult {
  const supplyData = supplyStore.get(niche);
  if (!supplyData) {
    return {
      niche,
      currentPrice: 0,
      optimizedPrice: 0,
      changePercent: 0,
      rationale: "No supply/demand data available for this niche.",
      expectedRevenueChange: 0,
    };
  }

  const { supply, demand, avgPrice } = supplyData;
  const ratio = demand > 0 ? supply / demand : supply > 0 ? 10 : 1;

  let priceMultiplier: number;
  let rationale: string;

  if (ratio < 0.5) {
    priceMultiplier = 1.25;
    rationale = "Severe undersupply. Strong demand supports significant price increase.";
  } else if (ratio < 0.8) {
    priceMultiplier = 1.15;
    rationale = "Moderate undersupply. Demand pressure supports price increase.";
  } else if (ratio > 2.0) {
    priceMultiplier = 0.85;
    rationale = "Significant oversupply. Price reduction needed to clear inventory.";
  } else if (ratio > 1.3) {
    priceMultiplier = 0.92;
    rationale = "Mild oversupply. Slight price reduction to improve velocity.";
  } else {
    priceMultiplier = 1.0;
    rationale = "Market is balanced. Maintain current pricing.";
  }

  const optimizedPrice = Math.round(avgPrice * priceMultiplier * 100) / 100;
  const changePercent = Math.round((priceMultiplier - 1) * 10000) / 100;
  const expectedRevenueChange = Math.round((optimizedPrice - avgPrice) * Math.min(supply, demand) * 100) / 100;

  return {
    niche,
    currentPrice: avgPrice,
    optimizedPrice,
    changePercent,
    rationale,
    expectedRevenueChange,
  };
}

// ---------------------------------------------------------------------------
// Buyer Ranking
// ---------------------------------------------------------------------------

export function rankBuyersByValue(): RankedBuyer[] {
  const buyers: RankedBuyer[] = [];

  for (const [buyerId, activity] of buyerActivityStore) {
    const avgSpend = activity.leadsPurchased > 0
      ? Math.round((activity.totalSpent / activity.leadsPurchased) * 100) / 100
      : 0;

    const daysSinceLastPurchase = activity.lastPurchase
      ? (Date.now() - new Date(activity.lastPurchase).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    const repeatRate = activity.leadsPurchased > 1
      ? Math.min(1, Math.round((activity.leadsPurchased / 10) * 100) / 100)
      : 0;

    const recencyScore = Math.max(0, 1 - daysSinceLastPurchase / 90);
    const frequencyScore = Math.min(1, activity.leadsPurchased / 50);
    const monetaryScore = Math.min(1, activity.totalSpent / 10000);

    const valueScore = Math.round((recencyScore * 0.3 + frequencyScore * 0.3 + monetaryScore * 0.4) * 100) / 100;

    let tier: RankedBuyer["tier"];
    if (valueScore > 0.75) tier = "platinum";
    else if (valueScore > 0.5) tier = "gold";
    else if (valueScore > 0.25) tier = "silver";
    else tier = "bronze";

    buyers.push({
      buyerId,
      totalSpent: activity.totalSpent,
      leadsPurchased: activity.leadsPurchased,
      avgSpendPerLead: avgSpend,
      repeatRate,
      valueScore,
      tier,
    });
  }

  return buyers.sort((a, b) => b.valueScore - a.valueScore);
}

// ---------------------------------------------------------------------------
// Lead Scarcity Signals
// ---------------------------------------------------------------------------

export function generateLeadScarcitySignals(): LeadScarcitySignal[] {
  const signals: LeadScarcitySignal[] = [];
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  for (const [niche, data] of supplyStore) {
    const recentClaims = claimLogStore.filter(
      (c) => c.niche === niche && new Date(c.claimedAt).getTime() > oneDayAgo,
    );

    const avgTimeToClaimHours = recentClaims.length > 0
      ? Math.round(recentClaims.reduce((s, c) => s + c.timeToClaimHours, 0) / recentClaims.length * 100) / 100
      : 48;

    let scarcityLevel: LeadScarcitySignal["scarcityLevel"];
    let urgencyMessage: string;

    if (data.supply < 5) {
      scarcityLevel = "critical";
      urgencyMessage = `Only ${data.supply} leads remaining in ${niche}. Claim now before they are gone.`;
    } else if (data.supply < 15 || (data.demand > 0 && data.supply / data.demand < 0.5)) {
      scarcityLevel = "high";
      urgencyMessage = `${data.supply} leads available in ${niche} with ${data.demand} buyers competing. Act fast.`;
    } else if (data.demand > 0 && data.supply / data.demand < 1) {
      scarcityLevel = "moderate";
      urgencyMessage = `Limited supply in ${niche}: ${data.supply} leads for ${data.demand} active buyers.`;
    } else {
      scarcityLevel = "low";
      urgencyMessage = `${data.supply} leads available in ${niche}.`;
    }

    signals.push({
      niche,
      availableLeads: data.supply,
      claimedLast24h: recentClaims.length,
      avgTimeToClaimHours,
      urgencyMessage,
      scarcityLevel,
    });
  }

  return signals.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
    return order[a.scarcityLevel] - order[b.scarcityLevel];
  });
}

// ---------------------------------------------------------------------------
// Marketplace Health Score
// ---------------------------------------------------------------------------

export function getMarketplaceHealthScore(): MarketplaceHealthScore {
  const totalSupply = Array.from(supplyStore.values()).reduce((s, d) => s + d.supply, 0);
  const totalDemand = Array.from(supplyStore.values()).reduce((s, d) => s + d.demand, 0);
  const activeBuyers = buyerActivityStore.size;
  const nicheCount = supplyStore.size;

  const liquidity = totalSupply > 0 && totalDemand > 0
    ? Math.round(Math.min(1, Math.min(totalSupply, totalDemand) / Math.max(totalSupply, totalDemand)) * 100) / 100
    : 0;

  const recentClaims = claimLogStore.filter(
    (c) => Date.now() - new Date(c.claimedAt).getTime() < 7 * 24 * 60 * 60 * 1000,
  );

  const avgTimeToSaleHours = recentClaims.length > 0
    ? Math.round(recentClaims.reduce((s, c) => s + c.timeToClaimHours, 0) / recentClaims.length * 100) / 100
    : 0;

  const repeatBuyers = Array.from(buyerActivityStore.values()).filter((b) => b.leadsPurchased > 1).length;
  const repeatBuyerRate = activeBuyers > 0 ? Math.round((repeatBuyers / activeBuyers) * 100) / 100 : 0;

  const growthRate = nicheCount > 0 ? Math.round(Math.min(1, nicheCount / 10) * 100) / 100 : 0;

  const buyerChurnRate = activeBuyers > 0
    ? Math.round((1 - repeatBuyerRate) * 0.5 * 100) / 100
    : 0;

  const sellerChurnRate = totalSupply > 0
    ? Math.round(Math.max(0, 1 - liquidity) * 0.3 * 100) / 100
    : 0;

  const overallScore = Math.round(
    (liquidity * 25 + (1 - buyerChurnRate) * 20 + repeatBuyerRate * 20 + growthRate * 15 + (avgTimeToSaleHours < 24 ? 20 : avgTimeToSaleHours < 48 ? 10 : 0)) * 100,
  ) / 100;

  let grade: MarketplaceHealthScore["grade"];
  if (overallScore >= 80) grade = "A";
  else if (overallScore >= 60) grade = "B";
  else if (overallScore >= 40) grade = "C";
  else if (overallScore >= 20) grade = "D";
  else grade = "F";

  return {
    overallScore,
    liquidity,
    buyerChurnRate,
    sellerChurnRate,
    avgTimeToSaleHours,
    repeatBuyerRate,
    growthRate,
    nicheCount,
    activeBuyers,
    activeLeads: totalSupply,
    grade,
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  supplyStore.clear();
  buyerActivityStore.clear();
  claimLogStore.length = 0;
}

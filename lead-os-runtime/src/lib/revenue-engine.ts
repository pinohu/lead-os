import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriceElasticity {
  niche: string;
  currentPrice: number;
  elasticityCoefficient: number;
  recommendedPriceMin: number;
  recommendedPriceMax: number;
  revenueAtCurrent: number;
  revenueAtOptimal: number;
}

export interface HistoricalPricePoint {
  price: number;
  conversionRate: number;
  period: string;
}

export interface UpsellOffer {
  name: string;
  price: number;
  timing: string;
  type: "soft-upsell" | "premium-upsell" | "cross-sell" | "annual-commitment";
}

export interface UpsellSequence {
  leadScore: number;
  tier: "none" | "basic" | "standard" | "premium";
  primaryOffer: string;
  upsells: UpsellOffer[];
}

export interface UpsellTiming {
  leadScore: number;
  niche: string;
  timings: { type: string; delayLabel: string; delayMs: number }[];
}

export interface LTVEstimate {
  leadId: string;
  niche: string;
  initialValue: number;
  predictedUpsellRevenue: number;
  referralValue: number;
  churnRisk: number;
  estimatedLTV: number;
}

export interface RevenueHistoryEntry {
  amount: number;
  type: "initial" | "upsell" | "renewal" | "referral";
  date: string;
}

export interface LTVSegment {
  tier: "high" | "medium" | "low";
  leads: Array<{ leadId: string; ltv: number }>;
  avgLTV: number;
  count: number;
}

export interface RetentionAction {
  leadId: string;
  ltvTier: "high" | "medium" | "low";
  action: string;
  channel: string;
  timing: string;
  expectedImpact: string;
}

export interface CrossSellOpportunity {
  leadId: string;
  currentService: string;
  recommendedService: string;
  relevanceScore: number;
  estimatedValue: number;
  reasoning: string;
}

export interface CrossSellOffer {
  opportunity: CrossSellOpportunity;
  headline: string;
  description: string;
  timing: string;
  channel: string;
}

export interface RevenuePathStep {
  name: string;
  description: string;
}

export interface RevenuePath {
  niche: string;
  steps: RevenuePathStep[];
}

export interface RevenuePathMetrics {
  tenantId: string;
  niche: string;
  trafficVolume: number;
  captureRate: number;
  conversionRate: number;
  avgOrderValue: number;
  upsellRate: number;
  ltv: number;
}

export interface RevenueLeak {
  stage: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  lostRevenue: number;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Niche service catalogs
// ---------------------------------------------------------------------------

const NICHE_SERVICES: Record<string, string[]> = {
  plumber: ["drain-cleaning", "pipe-repair", "water-heater", "bathroom-remodel", "sewer-line"],
  electrician: ["wiring", "panel-upgrade", "lighting", "ev-charger", "generator"],
  hvac: ["ac-install", "furnace-repair", "duct-cleaning", "maintenance-plan", "air-quality"],
  lawyer: ["consultation", "case-review", "retainer", "mediation", "litigation"],
  dentist: ["cleaning", "whitening", "implants", "invisalign", "cosmetic"],
  "real-estate": ["listing", "buyer-agent", "property-management", "investment-analysis", "staging"],
  roofing: ["inspection", "repair", "replacement", "gutter-install", "maintenance"],
  "solar-installer": ["residential-install", "commercial-install", "battery-storage", "monitoring", "maintenance"],
  insurance: ["auto", "home", "life", "umbrella", "business"],
  landscaping: ["lawn-care", "design", "hardscaping", "irrigation", "tree-service"],
};

const DEFAULT_SERVICES = ["primary-service", "consultation", "premium-package", "maintenance-plan", "add-on"];

// ---------------------------------------------------------------------------
// Price Elasticity
// ---------------------------------------------------------------------------

export function estimatePriceElasticity(
  niche: string,
  currentPrice: number,
  conversionRate: number,
  historicalData: HistoricalPricePoint[],
): PriceElasticity {
  let elasticityCoefficient = -1.2;

  if (historicalData.length >= 2) {
    const sorted = [...historicalData].sort((a, b) => a.price - b.price);
    let totalElasticity = 0;
    let pairCount = 0;

    for (let i = 1; i < sorted.length; i++) {
      const priceDelta = (sorted[i].price - sorted[i - 1].price) / sorted[i - 1].price;
      const convDelta = (sorted[i].conversionRate - sorted[i - 1].conversionRate) / sorted[i - 1].conversionRate;

      if (Math.abs(priceDelta) > 0.001) {
        totalElasticity += convDelta / priceDelta;
        pairCount++;
      }
    }

    if (pairCount > 0) {
      elasticityCoefficient = Math.round((totalElasticity / pairCount) * 100) / 100;
    }
  }

  const absElasticity = Math.abs(elasticityCoefficient);
  const priceFloor = currentPrice * 0.7;
  const priceCeiling = currentPrice * 1.3;

  let recommendedPriceMin: number;
  let recommendedPriceMax: number;

  if (absElasticity > 1.5) {
    recommendedPriceMin = Math.round(currentPrice * 0.85);
    recommendedPriceMax = Math.round(currentPrice * 1.05);
  } else if (absElasticity > 1.0) {
    recommendedPriceMin = Math.round(currentPrice * 0.9);
    recommendedPriceMax = Math.round(currentPrice * 1.1);
  } else {
    recommendedPriceMin = Math.round(currentPrice * 0.95);
    recommendedPriceMax = Math.round(currentPrice * 1.2);
  }

  recommendedPriceMin = Math.max(recommendedPriceMin, Math.round(priceFloor));
  recommendedPriceMax = Math.min(recommendedPriceMax, Math.round(priceCeiling));

  const revenueAtCurrent = Math.round(currentPrice * conversionRate * 100) / 100;
  const optimalPrice = (recommendedPriceMin + recommendedPriceMax) / 2;
  const projectedConversion = conversionRate * (1 + elasticityCoefficient * ((optimalPrice - currentPrice) / currentPrice));
  const revenueAtOptimal = Math.round(optimalPrice * Math.max(projectedConversion, 0) * 100) / 100;

  return {
    niche,
    currentPrice,
    elasticityCoefficient,
    recommendedPriceMin,
    recommendedPriceMax,
    revenueAtCurrent,
    revenueAtOptimal,
  };
}

export function findOptimalPrice(
  niche: string,
  priceRange: { min: number; max: number },
  targetMargin: number,
): { optimalPrice: number; expectedRevenue: number; expectedConversion: number } {
  const baseConversion = 5;
  const baseSensitivity = -0.02;

  let bestPrice = priceRange.min;
  let bestRevenue = 0;
  let bestConversion = 0;

  const steps = 20;
  const increment = (priceRange.max - priceRange.min) / steps;

  for (let i = 0; i <= steps; i++) {
    const price = priceRange.min + increment * i;
    const midPoint = (priceRange.min + priceRange.max) / 2;
    const deviation = (price - midPoint) / midPoint;
    const conversion = Math.max(0.1, baseConversion * (1 + baseSensitivity * deviation * 100));
    const revenue = price * (conversion / 100);

    if (revenue > bestRevenue) {
      bestRevenue = revenue;
      bestPrice = Math.round(price);
      bestConversion = Math.round(conversion * 100) / 100;
    }
  }

  return {
    optimalPrice: bestPrice,
    expectedRevenue: Math.round(bestRevenue * 100) / 100,
    expectedConversion: bestConversion,
  };
}

// ---------------------------------------------------------------------------
// Upsell Sequencing
// ---------------------------------------------------------------------------

export function generateUpsellSequence(
  niche: string,
  primaryOffer: string,
  leadScore: number,
): UpsellSequence {
  if (leadScore < 50) {
    return {
      leadScore,
      tier: "none",
      primaryOffer,
      upsells: [],
    };
  }

  if (leadScore < 70) {
    return {
      leadScore,
      tier: "basic",
      primaryOffer,
      upsells: [
        {
          name: `${niche} premium add-on`,
          price: 49,
          timing: "after-primary-conversion",
          type: "soft-upsell",
        },
      ],
    };
  }

  if (leadScore < 85) {
    return {
      leadScore,
      tier: "standard",
      primaryOffer,
      upsells: [
        {
          name: `${niche} premium package`,
          price: 149,
          timing: "immediate",
          type: "premium-upsell",
        },
        {
          name: `${niche} follow-up service`,
          price: 79,
          timing: "7-day-follow-up",
          type: "soft-upsell",
        },
      ],
    };
  }

  return {
    leadScore,
    tier: "premium",
    primaryOffer,
    upsells: [
      {
        name: `${niche} premium package`,
        price: 299,
        timing: "immediate",
        type: "premium-upsell",
      },
      {
        name: `${niche} complementary service`,
        price: 199,
        timing: "immediate",
        type: "cross-sell",
      },
      {
        name: `${niche} annual commitment`,
        price: 999,
        timing: "30-day-follow-up",
        type: "annual-commitment",
      },
    ],
  };
}

export function getUpsellTiming(
  leadScore: number,
  niche: string,
): UpsellTiming {
  const timings: UpsellTiming["timings"] = [];

  if (leadScore >= 85) {
    timings.push(
      { type: "premium-upsell", delayLabel: "immediate", delayMs: 0 },
      { type: "cross-sell", delayLabel: "24h", delayMs: 24 * 60 * 60 * 1000 },
      { type: "annual-commitment", delayLabel: "30d", delayMs: 30 * 24 * 60 * 60 * 1000 },
    );
  } else if (leadScore >= 70) {
    timings.push(
      { type: "premium-upsell", delayLabel: "immediate", delayMs: 0 },
      { type: "soft-upsell", delayLabel: "7d", delayMs: 7 * 24 * 60 * 60 * 1000 },
    );
  } else if (leadScore >= 50) {
    timings.push(
      { type: "soft-upsell", delayLabel: "after-primary-conversion", delayMs: 0 },
    );
  }

  return { leadScore, niche, timings };
}

// ---------------------------------------------------------------------------
// LTV Optimization
// ---------------------------------------------------------------------------

export function calculateLTV(
  lead: { leadId: string; score: number },
  niche: string,
  revenueHistory: RevenueHistoryEntry[],
): LTVEstimate {
  const initialValue = revenueHistory
    .filter((r) => r.type === "initial")
    .reduce((sum, r) => sum + r.amount, 0);

  const upsellRevenue = revenueHistory
    .filter((r) => r.type === "upsell" || r.type === "renewal")
    .reduce((sum, r) => sum + r.amount, 0);

  const predictedUpsellRevenue = upsellRevenue > 0
    ? upsellRevenue * 1.5
    : initialValue * 0.3;

  const referralValue = lead.score >= 80
    ? initialValue * 0.2
    : initialValue * 0.05;

  const churnRisk = lead.score >= 80
    ? 0.1
    : lead.score >= 50
      ? 0.3
      : 0.6;

  const grossLTV = initialValue + predictedUpsellRevenue + referralValue;
  const estimatedLTV = Math.round(grossLTV * (1 - churnRisk) * 100) / 100;

  return {
    leadId: lead.leadId,
    niche,
    initialValue,
    predictedUpsellRevenue: Math.round(predictedUpsellRevenue * 100) / 100,
    referralValue: Math.round(referralValue * 100) / 100,
    churnRisk,
    estimatedLTV,
  };
}

export function segmentByLTV(
  leads: Array<{ leadId: string; ltv: number }>,
): LTVSegment[] {
  if (leads.length === 0) {
    return [
      { tier: "high", leads: [], avgLTV: 0, count: 0 },
      { tier: "medium", leads: [], avgLTV: 0, count: 0 },
      { tier: "low", leads: [], avgLTV: 0, count: 0 },
    ];
  }

  const sorted = [...leads].sort((a, b) => b.ltv - a.ltv);
  const topThreshold = Math.ceil(sorted.length * 0.2);
  const bottomThreshold = Math.ceil(sorted.length * 0.5);

  const high = sorted.slice(0, topThreshold);
  const medium = sorted.slice(topThreshold, bottomThreshold);
  const low = sorted.slice(bottomThreshold);

  function buildSegment(tier: LTVSegment["tier"], items: typeof leads): LTVSegment {
    const avgLTV = items.length > 0
      ? Math.round(items.reduce((s, l) => s + l.ltv, 0) / items.length * 100) / 100
      : 0;
    return { tier, leads: items, avgLTV, count: items.length };
  }

  return [
    buildSegment("high", high),
    buildSegment("medium", medium),
    buildSegment("low", low),
  ];
}

export function recommendRetentionAction(
  lead: { leadId: string },
  ltvTier: "high" | "medium" | "low",
): RetentionAction {
  if (ltvTier === "high") {
    return {
      leadId: lead.leadId,
      ltvTier,
      action: "VIP treatment with dedicated account manager and priority support",
      channel: "phone",
      timing: "immediate",
      expectedImpact: "reduce churn by 40% and increase referral rate",
    };
  }

  if (ltvTier === "medium") {
    return {
      leadId: lead.leadId,
      ltvTier,
      action: "nurture upgrade with targeted content and exclusive offers",
      channel: "email",
      timing: "weekly",
      expectedImpact: "increase upgrade rate by 25% and move to high-value tier",
    };
  }

  return {
    leadId: lead.leadId,
    ltvTier,
    action: "win-back campaign with special discount and re-engagement sequence",
    channel: "email",
    timing: "bi-weekly",
    expectedImpact: "recover 15% of at-risk customers and reduce churn",
  };
}

// ---------------------------------------------------------------------------
// Cross-Sell
// ---------------------------------------------------------------------------

export function identifyCrossSellOpportunities(
  lead: { leadId: string; currentService: string; score: number },
  niche: string,
  allServices: string[],
): CrossSellOpportunity[] {
  const services = allServices.length > 0
    ? allServices
    : (NICHE_SERVICES[niche] ?? DEFAULT_SERVICES);

  return services
    .filter((svc) => svc !== lead.currentService)
    .map((svc) => {
      const relevanceScore = Math.round((lead.score / 100) * 0.8 * 100) / 100;
      const estimatedValue = Math.round(50 + lead.score * 2);

      return {
        leadId: lead.leadId,
        currentService: lead.currentService,
        recommendedService: svc,
        relevanceScore,
        estimatedValue,
        reasoning: `Based on ${niche} patterns, customers using ${lead.currentService} frequently adopt ${svc}`,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function generateCrossSellOffer(
  opportunity: CrossSellOpportunity,
): CrossSellOffer {
  return {
    opportunity,
    headline: `Enhance your ${opportunity.currentService} with ${opportunity.recommendedService}`,
    description: opportunity.reasoning,
    timing: opportunity.relevanceScore > 0.6 ? "immediate" : "7-day-follow-up",
    channel: opportunity.relevanceScore > 0.6 ? "in-app" : "email",
  };
}

// ---------------------------------------------------------------------------
// Revenue Path
// ---------------------------------------------------------------------------

export function definePrimaryRevenuePath(niche: string): RevenuePath {
  return {
    niche,
    steps: [
      { name: "traffic", description: `Inbound traffic for ${niche} services` },
      { name: "capture", description: "Lead capture via forms, chat, and lead magnets" },
      { name: "qualification", description: "Scoring and qualifying leads based on intent and fit" },
      { name: "primary-conversion", description: "Primary offer conversion" },
      { name: "upsell", description: "Post-conversion upsell sequence" },
      { name: "retention", description: "Long-term value through retention and referrals" },
    ],
  };
}

export async function getRevenuePathMetrics(tenantId: string): Promise<RevenuePathMetrics> {
  const pool = getPool();

  const defaults: RevenuePathMetrics = {
    tenantId,
    niche: "unknown",
    trafficVolume: 0,
    captureRate: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    upsellRate: 0,
    ltv: 0,
  };

  if (!pool) return defaults;

  try {
    const leadResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions,
         COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS avg_score
       FROM lead_os_leads
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const total = leadResult.rows[0]?.total ?? 0;
    const conversions = leadResult.rows[0]?.conversions ?? 0;

    const nicheResult = await pool.query(
      `SELECT niche FROM lead_os_leads WHERE tenant_id = $1 LIMIT 1`,
      [tenantId],
    );
    const niche = nicheResult.rows[0]?.niche ?? "unknown";

    let totalRevenue = 0;
    try {
      const revResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::numeric AS total_revenue
         FROM lead_os_revenue_events
         WHERE tenant_id = $1`,
        [tenantId],
      );
      totalRevenue = Number(revResult.rows[0]?.total_revenue ?? 0);
    } catch {
      // revenue table may not exist
    }

    const conversionRate = total > 0 ? Math.round((conversions / total) * 1000) / 10 : 0;
    const avgOrderValue = conversions > 0 ? Math.round(totalRevenue / conversions * 100) / 100 : 0;

    return {
      tenantId,
      niche,
      trafficVolume: total,
      captureRate: total > 0 ? 100 : 0,
      conversionRate,
      avgOrderValue,
      upsellRate: 0,
      ltv: avgOrderValue * 1.3,
    };
  } catch {
    return defaults;
  }
}

export function identifyRevenueLeaks(metrics: RevenuePathMetrics): RevenueLeak[] {
  const leaks: RevenueLeak[] = [];

  if (metrics.captureRate < 30) {
    leaks.push({
      stage: "capture",
      metric: "captureRate",
      currentValue: metrics.captureRate,
      expectedValue: 30,
      lostRevenue: Math.round((30 - metrics.captureRate) / 100 * metrics.trafficVolume * metrics.avgOrderValue),
      recommendation: "improve lead capture forms, add lead magnets, and optimize landing pages",
    });
  }

  if (metrics.conversionRate < 3) {
    leaks.push({
      stage: "primary-conversion",
      metric: "conversionRate",
      currentValue: metrics.conversionRate,
      expectedValue: 5,
      lostRevenue: Math.round((5 - metrics.conversionRate) / 100 * metrics.trafficVolume * metrics.avgOrderValue),
      recommendation: "recalibrate scoring, improve offer positioning, and add social proof",
    });
  }

  if (metrics.upsellRate < 10) {
    leaks.push({
      stage: "upsell",
      metric: "upsellRate",
      currentValue: metrics.upsellRate,
      expectedValue: 15,
      lostRevenue: Math.round((15 - metrics.upsellRate) / 100 * metrics.trafficVolume * metrics.avgOrderValue * 0.5),
      recommendation: "implement upsell sequences based on lead score tiers",
    });
  }

  if (metrics.ltv < metrics.avgOrderValue * 1.5) {
    leaks.push({
      stage: "retention",
      metric: "ltv",
      currentValue: metrics.ltv,
      expectedValue: Math.round(metrics.avgOrderValue * 2),
      lostRevenue: Math.round((metrics.avgOrderValue * 2 - metrics.ltv) * metrics.trafficVolume * metrics.conversionRate / 100),
      recommendation: "add retention programs, referral incentives, and renewal campaigns",
    });
  }

  return leaks;
}

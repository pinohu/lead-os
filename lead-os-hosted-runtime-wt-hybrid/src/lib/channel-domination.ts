// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelTier = "double-down" | "maintain" | "optimize" | "kill";
export type ChannelTrend = "improving" | "stable" | "declining";

export interface ChannelMetric {
  channel: string;
  leadVolume: number;
  cost: number;
  conversions: number;
  revenue: number;
  period: string;
}

export interface ChannelAnalysis {
  channel: string;
  leadVolume: number;
  costPerLead: number;
  conversionRate: number;
  revenuePerLead: number;
  roi: number;
  trend: ChannelTrend;
}

export interface ChannelRanking {
  channel: string;
  tier: ChannelTier;
  roi: number;
  trend: ChannelTrend;
  rank: number;
}

export interface BudgetAllocation {
  channel: string;
  tier: ChannelTier;
  allocatedBudget: number;
  percentageOfTotal: number;
}

export interface ChannelTactic {
  channel: string;
  tactics: string[];
}

export interface ChannelStrategy {
  tenantId: string;
  niche: string;
  doubleDown: ChannelTactic[];
  maintain: ChannelTactic[];
  optimize: ChannelTactic[];
  abandon: ChannelTactic[];
  generatedAt: string;
}

export interface SaturationSignal {
  channel: string;
  isSaturated: boolean;
  costPerLeadTrend: number[];
  volumeTrend: number[];
  inflectionPeriod: string | null;
  recommendation: string;
}

export interface UnexploitedChannel {
  channel: string;
  nicheRelevance: number;
  estimatedRoi: number;
  difficulty: "low" | "medium" | "high";
  reasoning: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const channelMetricStore: ChannelMetric[] = [];

let metricIdCounter = 0;

// ---------------------------------------------------------------------------
// Channel-niche intelligence
// ---------------------------------------------------------------------------

const NICHE_CHANNEL_AFFINITY: Record<string, Record<string, number>> = {
  construction: {
    "google-ads": 0.9, "seo": 0.85, "referral": 0.8, "facebook-ads": 0.6,
    "linkedin": 0.5, "direct-mail": 0.7, "youtube": 0.65, "tiktok": 0.3,
    "email": 0.6, "yelp": 0.75,
  },
  legal: {
    "google-ads": 0.95, "seo": 0.9, "referral": 0.85, "facebook-ads": 0.5,
    "linkedin": 0.7, "direct-mail": 0.4, "youtube": 0.5, "tiktok": 0.2,
    "email": 0.55, "yelp": 0.6,
  },
  dental: {
    "google-ads": 0.85, "seo": 0.8, "referral": 0.7, "facebook-ads": 0.75,
    "linkedin": 0.3, "direct-mail": 0.6, "youtube": 0.55, "tiktok": 0.5,
    "email": 0.65, "yelp": 0.8,
  },
  default: {
    "google-ads": 0.8, "seo": 0.75, "referral": 0.7, "facebook-ads": 0.65,
    "linkedin": 0.5, "direct-mail": 0.5, "youtube": 0.55, "tiktok": 0.4,
    "email": 0.6, "yelp": 0.5,
  },
};

const CHANNEL_TACTICS: Record<string, string[]> = {
  "google-ads": [
    "Increase bids on high-intent keywords",
    "Add negative keywords to reduce waste",
    "Expand to Performance Max campaigns",
    "Test responsive search ads with new headlines",
  ],
  "seo": [
    "Target long-tail keywords with buyer intent",
    "Publish comparison and 'best of' content",
    "Build topical authority with content clusters",
    "Optimize existing pages for featured snippets",
  ],
  "facebook-ads": [
    "Test lookalike audiences from top customers",
    "Run lead gen forms with instant follow-up",
    "Create retargeting campaigns for site visitors",
    "Use video testimonials in ad creative",
  ],
  "referral": [
    "Launch a structured referral program",
    "Offer double-sided incentives",
    "Automate referral request after positive outcomes",
    "Partner with complementary businesses",
  ],
  "linkedin": [
    "Publish thought leadership content weekly",
    "Run InMail campaigns to decision-makers",
    "Engage in niche LinkedIn groups",
    "Test LinkedIn conversation ads",
  ],
  "email": [
    "Segment list by engagement level",
    "A/B test subject lines systematically",
    "Implement behavior-triggered sequences",
    "Clean list quarterly to improve deliverability",
  ],
  "youtube": [
    "Create educational how-to content",
    "Run pre-roll ads targeting niche keywords",
    "Publish client testimonials and case studies",
    "Optimize titles and thumbnails for CTR",
  ],
  "direct-mail": [
    "Target high-value zip codes",
    "Use personalized variable data printing",
    "Include QR codes linking to landing pages",
    "Test postcard vs letter formats",
  ],
  "tiktok": [
    "Create behind-the-scenes content",
    "Partner with micro-influencers in the niche",
    "Run spark ads on organic viral posts",
    "Post consistently 3-5 times per week",
  ],
  "yelp": [
    "Respond to all reviews within 24 hours",
    "Run Yelp Ads for top category placement",
    "Encourage satisfied customers to leave reviews",
    "Complete business profile with photos and details",
  ],
};

// ---------------------------------------------------------------------------
// Data ingestion
// ---------------------------------------------------------------------------

export function recordChannelMetric(metric: ChannelMetric): void {
  channelMetricStore.push(metric);
  metricIdCounter += 1;
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

export function analyzeChannelPerformance(
  tenantId: string,
  period?: string,
): ChannelAnalysis[] {
  const metrics = channelMetricStore.filter((m) => {
    if (period && m.period !== period) return false;
    return true;
  });

  const channelMap = new Map<string, {
    leadVolume: number;
    cost: number;
    conversions: number;
    revenue: number;
    periods: string[];
  }>();

  for (const m of metrics) {
    const entry = channelMap.get(m.channel) ?? {
      leadVolume: 0, cost: 0, conversions: 0, revenue: 0, periods: [],
    };
    entry.leadVolume += m.leadVolume;
    entry.cost += m.cost;
    entry.conversions += m.conversions;
    entry.revenue += m.revenue;
    if (!entry.periods.includes(m.period)) {
      entry.periods.push(m.period);
    }
    channelMap.set(m.channel, entry);
  }

  const analyses: ChannelAnalysis[] = [];
  for (const [channel, data] of channelMap) {
    const costPerLead = data.leadVolume > 0
      ? Math.round((data.cost / data.leadVolume) * 100) / 100
      : 0;
    const conversionRate = data.leadVolume > 0
      ? Math.round((data.conversions / data.leadVolume) * 10000) / 10000
      : 0;
    const revenuePerLead = data.leadVolume > 0
      ? Math.round((data.revenue / data.leadVolume) * 100) / 100
      : 0;
    const roi = data.cost > 0
      ? Math.round((data.revenue / data.cost) * 100) / 100
      : data.revenue > 0 ? 999 : 0;

    const trend = computeTrend(channel);

    analyses.push({
      channel,
      leadVolume: data.leadVolume,
      costPerLead,
      conversionRate,
      revenuePerLead,
      roi,
      trend,
    });
  }

  return analyses.sort((a, b) => b.roi - a.roi);
}

function computeTrend(channel: string): ChannelTrend {
  const metrics = channelMetricStore
    .filter((m) => m.channel === channel)
    .sort((a, b) => a.period.localeCompare(b.period));

  if (metrics.length < 3) return "stable";

  const recent = metrics.slice(-3);
  const rois = recent.map((m) =>
    m.cost > 0 ? m.revenue / m.cost : m.revenue > 0 ? 10 : 0,
  );

  const firstHalf = rois[0];
  const secondHalf = rois[rois.length - 1];
  const change = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;

  if (change > 0.1) return "improving";
  if (change < -0.1) return "declining";
  return "stable";
}

export function rankChannels(analysis: ChannelAnalysis[]): ChannelRanking[] {
  const sorted = [...analysis].sort((a, b) => b.roi - a.roi);

  return sorted.map((a, i) => {
    let tier: ChannelTier;
    if (a.roi > 3 && a.trend !== "declining") {
      tier = "double-down";
    } else if (a.roi >= 1 && a.roi <= 3) {
      tier = "maintain";
    } else if (a.roi >= 0.5 && a.roi < 1) {
      tier = "optimize";
    } else {
      tier = "kill";
    }

    return {
      channel: a.channel,
      tier,
      roi: a.roi,
      trend: a.trend,
      rank: i + 1,
    };
  });
}

export function generateBudgetAllocation(
  ranking: ChannelRanking[],
  totalBudget: number,
): BudgetAllocation[] {
  const tierBudgets: Record<ChannelTier, number> = {
    "double-down": 0.50,
    "maintain": 0.30,
    "optimize": 0.15,
    "kill": 0.05,
  };

  const tierCounts: Record<ChannelTier, number> = {
    "double-down": 0,
    "maintain": 0,
    "optimize": 0,
    "kill": 0,
  };

  for (const r of ranking) {
    tierCounts[r.tier] += 1;
  }

  const allocations: BudgetAllocation[] = [];

  for (const r of ranking) {
    const tierTotal = totalBudget * tierBudgets[r.tier];
    const channelCount = tierCounts[r.tier];
    const allocated = channelCount > 0
      ? Math.round((tierTotal / channelCount) * 100) / 100
      : 0;
    const percentage = totalBudget > 0
      ? Math.round((allocated / totalBudget) * 10000) / 100
      : 0;

    allocations.push({
      channel: r.channel,
      tier: r.tier,
      allocatedBudget: allocated,
      percentageOfTotal: percentage,
    });
  }

  return allocations;
}

export function generateChannelStrategy(
  tenantId: string,
  niche: string,
): ChannelStrategy {
  const analysis = analyzeChannelPerformance(tenantId);
  const ranking = rankChannels(analysis);

  const getTactics = (channel: string): string[] => {
    return CHANNEL_TACTICS[channel] ?? [
      "Research best practices for this channel",
      "Set up tracking and attribution",
      "Run a small test campaign",
    ];
  };

  const doubleDown = ranking
    .filter((r) => r.tier === "double-down")
    .map((r) => ({ channel: r.channel, tactics: getTactics(r.channel) }));

  const maintain = ranking
    .filter((r) => r.tier === "maintain")
    .map((r) => ({ channel: r.channel, tactics: getTactics(r.channel).slice(0, 2) }));

  const optimize = ranking
    .filter((r) => r.tier === "optimize")
    .map((r) => ({ channel: r.channel, tactics: getTactics(r.channel).slice(0, 2) }));

  const abandon = ranking
    .filter((r) => r.tier === "kill")
    .map((r) => ({ channel: r.channel, tactics: ["Sunset spend over 30 days", "Redirect budget to Tier 1 channels"] }));

  return {
    tenantId,
    niche,
    doubleDown,
    maintain,
    optimize,
    abandon,
    generatedAt: new Date().toISOString(),
  };
}

export function detectChannelSaturation(
  channel: string,
  historicalData: ChannelMetric[],
): SaturationSignal {
  const sorted = [...historicalData]
    .filter((d) => d.channel === channel)
    .sort((a, b) => a.period.localeCompare(b.period));

  if (sorted.length < 3) {
    return {
      channel,
      isSaturated: false,
      costPerLeadTrend: sorted.map((d) =>
        d.leadVolume > 0 ? Math.round((d.cost / d.leadVolume) * 100) / 100 : 0,
      ),
      volumeTrend: sorted.map((d) => d.leadVolume),
      inflectionPeriod: null,
      recommendation: "Insufficient data for saturation analysis",
    };
  }

  const cplTrend = sorted.map((d) =>
    d.leadVolume > 0 ? Math.round((d.cost / d.leadVolume) * 100) / 100 : 0,
  );
  const volumeTrend = sorted.map((d) => d.leadVolume);

  let inflectionPeriod: string | null = null;
  let isSaturated = false;

  for (let i = 2; i < sorted.length; i++) {
    const cplIncreasing = cplTrend[i] > cplTrend[i - 1] && cplTrend[i - 1] > cplTrend[i - 2];
    const volumeFlat = Math.abs(volumeTrend[i] - volumeTrend[i - 1]) <=
      volumeTrend[i - 1] * 0.1;

    if (cplIncreasing && volumeFlat) {
      isSaturated = true;
      inflectionPeriod = sorted[i - 1].period;
      break;
    }
  }

  const recommendation = isSaturated
    ? `Channel "${channel}" is showing diminishing returns. Cost per lead is rising while volume is flat. Consider reducing spend and reallocating to higher-ROI channels.`
    : `Channel "${channel}" is not yet saturated. Continue current strategy.`;

  return {
    channel,
    isSaturated,
    costPerLeadTrend: cplTrend,
    volumeTrend,
    inflectionPeriod,
    recommendation,
  };
}

export function identifyUnexploitedChannels(
  niche: string,
  currentChannels: string[],
): UnexploitedChannel[] {
  const affinities = NICHE_CHANNEL_AFFINITY[niche.toLowerCase()]
    ?? NICHE_CHANNEL_AFFINITY["default"];

  const currentSet = new Set(currentChannels.map((c) => c.toLowerCase()));

  const unexploited: UnexploitedChannel[] = [];

  for (const [channel, relevance] of Object.entries(affinities)) {
    if (currentSet.has(channel)) continue;

    let difficulty: "low" | "medium" | "high";
    if (["email", "referral", "yelp"].includes(channel)) {
      difficulty = "low";
    } else if (["seo", "facebook-ads", "youtube"].includes(channel)) {
      difficulty = "medium";
    } else {
      difficulty = "high";
    }

    const estimatedRoi = Math.round(relevance * 4 * 100) / 100;

    unexploited.push({
      channel,
      nicheRelevance: Math.round(relevance * 100),
      estimatedRoi,
      difficulty,
      reasoning: `"${channel}" has ${Math.round(relevance * 100)}% relevance for the ${niche} niche and is not currently in use.`,
    });
  }

  return unexploited.sort((a, b) => b.nicheRelevance - a.nicheRelevance);
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  channelMetricStore.length = 0;
  metricIdCounter = 0;
}

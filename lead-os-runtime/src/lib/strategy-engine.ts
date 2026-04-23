import { getPool, queryPostgres } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DecisionType =
  | "niche-expand"
  | "niche-contract"
  | "channel-scale"
  | "channel-kill"
  | "offer-push"
  | "offer-retire"
  | "model-shift";

export type DecisionPriority = "critical" | "high" | "medium" | "low";
export type DecisionStatus = "proposed" | "approved" | "executing" | "completed" | "rejected";

export interface StrategicDecision {
  id: string;
  tenantId: string;
  type: DecisionType;
  recommendation: string;
  rationale: string;
  expectedImpact: { revenue: number; timeframe: string };
  confidence: number;
  priority: DecisionPriority;
  status: DecisionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicPlan {
  tenantId: string;
  decisions: StrategicDecision[];
  generatedAt: string;
  summary: string;
}

export interface NicheEvaluation {
  niche: string;
  revenue: number;
  conversionRate: number;
  competitionScore: number;
  recommendation: "expand" | "contract" | "maintain";
  rationale: string;
}

export interface ChannelEvaluation {
  channel: string;
  roi: number;
  trend: string;
  saturation: number;
  recommendation: "scale" | "kill" | "maintain";
  rationale: string;
}

export interface OfferEvaluation {
  offer: string;
  revenuePerView: number;
  conversionRate: number;
  margin: number;
  recommendation: "push" | "retire" | "maintain";
  rationale: string;
}

export interface RevenueModelFit {
  model: string;
  fitScore: number;
  rationale: string;
  recommended: boolean;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const decisionStore = new Map<string, StrategicDecision>();
const planStore = new Map<string, StrategicPlan>();

let decisionCounter = 0;
let planCounter = 0;

let schemaReady: Promise<void> | null = null;

async function ensureStrategySchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_strategy_decisions (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          type TEXT NOT NULL,
          recommendation TEXT NOT NULL,
          rationale TEXT NOT NULL,
          expected_impact JSONB NOT NULL DEFAULT '{}',
          confidence NUMERIC(4,3) NOT NULL DEFAULT 0,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'proposed',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_strategy_decisions_tenant
          ON lead_os_strategy_decisions(tenant_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_strategy_decisions_status
          ON lead_os_strategy_decisions(status)
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

function generateDecisionId(): string {
  decisionCounter += 1;
  return `sd_${Date.now()}_${decisionCounter}`;
}

// ---------------------------------------------------------------------------
// Niche Portfolio Evaluation
// ---------------------------------------------------------------------------

const NICHE_BENCHMARKS: Record<string, { avgRevenue: number; avgConversion: number; competition: number }> = {
  plumber: { avgRevenue: 5000, avgConversion: 0.08, competition: 0.6 },
  electrician: { avgRevenue: 4500, avgConversion: 0.07, competition: 0.55 },
  hvac: { avgRevenue: 6000, avgConversion: 0.09, competition: 0.65 },
  lawyer: { avgRevenue: 12000, avgConversion: 0.05, competition: 0.8 },
  dentist: { avgRevenue: 3000, avgConversion: 0.1, competition: 0.5 },
  "real-estate": { avgRevenue: 8000, avgConversion: 0.06, competition: 0.75 },
  roofing: { avgRevenue: 7000, avgConversion: 0.07, competition: 0.55 },
  "solar-installer": { avgRevenue: 9000, avgConversion: 0.04, competition: 0.45 },
  insurance: { avgRevenue: 2500, avgConversion: 0.12, competition: 0.7 },
  landscaping: { avgRevenue: 2000, avgConversion: 0.11, competition: 0.4 },
};

const DEFAULT_BENCHMARK = { avgRevenue: 4000, avgConversion: 0.08, competition: 0.5 };

export function evaluateNichePortfolio(
  tenantId: string,
  nicheRevenues: Record<string, number>,
  nicheConversions: Record<string, number>,
): NicheEvaluation[] {
  const evaluations: NicheEvaluation[] = [];

  for (const [niche, revenue] of Object.entries(nicheRevenues)) {
    const benchmark = NICHE_BENCHMARKS[niche] ?? DEFAULT_BENCHMARK;
    const conversionRate = nicheConversions[niche] ?? 0;
    const revenueRatio = benchmark.avgRevenue > 0 ? revenue / benchmark.avgRevenue : 0;
    const conversionRatio = benchmark.avgConversion > 0 ? conversionRate / benchmark.avgConversion : 0;

    let recommendation: NicheEvaluation["recommendation"];
    let rationale: string;

    if (revenueRatio > 1.2 && conversionRatio > 0.8 && benchmark.competition < 0.7) {
      recommendation = "expand";
      rationale = `Revenue ${Math.round(revenueRatio * 100)}% of benchmark with low competition (${benchmark.competition}). High growth potential.`;
    } else if (revenueRatio < 0.5 || (conversionRatio < 0.4 && benchmark.competition > 0.7)) {
      recommendation = "contract";
      rationale = `Revenue at ${Math.round(revenueRatio * 100)}% of benchmark with high competition. Resources better allocated elsewhere.`;
    } else {
      recommendation = "maintain";
      rationale = `Performing at ${Math.round(revenueRatio * 100)}% of benchmark. Stable position, monitor for changes.`;
    }

    evaluations.push({
      niche,
      revenue,
      conversionRate,
      competitionScore: benchmark.competition,
      recommendation,
      rationale,
    });
  }

  return evaluations.sort((a, b) => b.revenue - a.revenue);
}

// ---------------------------------------------------------------------------
// Channel Strategy Evaluation
// ---------------------------------------------------------------------------

export function evaluateChannelStrategy(
  tenantId: string,
  channelData: Array<{ channel: string; roi: number; trend: string; volume: number; cost: number }>,
): ChannelEvaluation[] {
  return channelData.map((ch) => {
    const saturation = ch.cost > 0 && ch.volume > 0
      ? Math.min(1, ch.cost / (ch.volume * 100))
      : 0;

    let recommendation: ChannelEvaluation["recommendation"];
    let rationale: string;

    if (ch.roi > 3 && ch.trend !== "declining" && saturation < 0.7) {
      recommendation = "scale";
      rationale = `ROI of ${ch.roi}x with ${ch.trend} trend and ${Math.round(saturation * 100)}% saturation. Room to increase spend.`;
    } else if (ch.roi < 0.8 || (ch.trend === "declining" && ch.roi < 1.5)) {
      recommendation = "kill";
      rationale = `ROI of ${ch.roi}x with ${ch.trend} trend. Below profitability threshold.`;
    } else {
      recommendation = "maintain";
      rationale = `ROI of ${ch.roi}x is acceptable. Monitor trend (${ch.trend}) and saturation (${Math.round(saturation * 100)}%).`;
    }

    return {
      channel: ch.channel,
      roi: ch.roi,
      trend: ch.trend,
      saturation: Math.round(saturation * 100) / 100,
      recommendation,
      rationale,
    };
  }).sort((a, b) => b.roi - a.roi);
}

// ---------------------------------------------------------------------------
// Offer Strategy Evaluation
// ---------------------------------------------------------------------------

export function evaluateOfferStrategy(
  tenantId: string,
  offers: Array<{ offer: string; revenue: number; views: number; conversions: number; cost: number }>,
): OfferEvaluation[] {
  return offers.map((o) => {
    const revenuePerView = o.views > 0 ? Math.round((o.revenue / o.views) * 100) / 100 : 0;
    const conversionRate = o.views > 0 ? Math.round((o.conversions / o.views) * 10000) / 10000 : 0;
    const margin = o.revenue > 0 ? Math.round(((o.revenue - o.cost) / o.revenue) * 100) / 100 : 0;

    let recommendation: OfferEvaluation["recommendation"];
    let rationale: string;

    if (revenuePerView > 5 && conversionRate > 0.03 && margin > 0.4) {
      recommendation = "push";
      rationale = `Strong RPV ($${revenuePerView}), ${(conversionRate * 100).toFixed(1)}% conversion, ${Math.round(margin * 100)}% margin. Scale aggressively.`;
    } else if (revenuePerView < 1 || conversionRate < 0.005 || margin < 0.1) {
      recommendation = "retire";
      rationale = `Weak metrics: RPV $${revenuePerView}, ${(conversionRate * 100).toFixed(1)}% conversion, ${Math.round(margin * 100)}% margin. Replace with better offer.`;
    } else {
      recommendation = "maintain";
      rationale = `Moderate performance: RPV $${revenuePerView}, ${(conversionRate * 100).toFixed(1)}% conversion. Test variants to improve.`;
    }

    return { offer: o.offer, revenuePerView, conversionRate, margin, recommendation, rationale };
  }).sort((a, b) => b.revenuePerView - a.revenuePerView);
}

// ---------------------------------------------------------------------------
// Revenue Model Fit
// ---------------------------------------------------------------------------

const REVENUE_MODELS: Array<{ model: string; idealLeadVolume: number; idealAvgDeal: number; description: string }> = [
  { model: "pay-per-lead", idealLeadVolume: 500, idealAvgDeal: 50, description: "Best for high volume, low ticket niches" },
  { model: "saas-subscription", idealLeadVolume: 100, idealAvgDeal: 200, description: "Best for recurring value, mid-market" },
  { model: "revenue-share", idealLeadVolume: 50, idealAvgDeal: 1000, description: "Best for high-ticket, partnership-based" },
  { model: "marketplace-auction", idealLeadVolume: 300, idealAvgDeal: 100, description: "Best for competitive niches with many buyers" },
  { model: "hybrid", idealLeadVolume: 200, idealAvgDeal: 150, description: "Best for diversified revenue streams" },
];

export function evaluateRevenueModelFit(
  tenantId: string,
  metrics: { leadVolume: number; avgDealValue: number; buyerCount: number },
): RevenueModelFit[] {
  const fits = REVENUE_MODELS.map((rm) => {
    const volumeRatio = metrics.leadVolume / rm.idealLeadVolume;
    const dealRatio = metrics.avgDealValue / rm.idealAvgDeal;

    const volumeScore = 1 - Math.min(1, Math.abs(1 - volumeRatio) * 0.5);
    const dealScore = 1 - Math.min(1, Math.abs(1 - dealRatio) * 0.5);
    const fitScore = Math.round((volumeScore * 0.5 + dealScore * 0.5) * 100) / 100;

    return {
      model: rm.model,
      fitScore,
      rationale: `${rm.description}. Volume fit: ${Math.round(volumeScore * 100)}%, deal size fit: ${Math.round(dealScore * 100)}%.`,
      recommended: false,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  if (fits.length > 0) {
    fits[0].recommended = true;
  }

  return fits;
}

// ---------------------------------------------------------------------------
// Decision Management
// ---------------------------------------------------------------------------

export async function createDecision(
  tenantId: string,
  type: DecisionType,
  recommendation: string,
  rationale: string,
  expectedImpact: { revenue: number; timeframe: string },
  confidence: number,
  priority: DecisionPriority,
): Promise<StrategicDecision> {
  const now = new Date().toISOString();
  const decision: StrategicDecision = {
    id: generateDecisionId(),
    tenantId,
    type,
    recommendation,
    rationale,
    expectedImpact,
    confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 1000) / 1000,
    priority,
    status: "proposed",
    createdAt: now,
    updatedAt: now,
  };

  decisionStore.set(decision.id, decision);

  try {
    await ensureStrategySchema();
    const pool = getPool();
    if (pool) {
      await pool.query(
        `INSERT INTO lead_os_strategy_decisions (id, tenant_id, type, recommendation, rationale, expected_impact, confidence, priority, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [decision.id, tenantId, type, recommendation, rationale, JSON.stringify(expectedImpact), decision.confidence, priority, decision.status, decision.createdAt, decision.updatedAt],
      );
    }
  } catch {
    // in-memory fallback
  }

  return decision;
}

export function getStrategicDecisions(
  tenantId: string,
  statusFilter?: DecisionStatus,
): StrategicDecision[] {
  const results: StrategicDecision[] = [];
  for (const d of decisionStore.values()) {
    if (d.tenantId !== tenantId) continue;
    if (statusFilter && d.status !== statusFilter) continue;
    results.push(d);
  }
  return results.sort((a, b) => {
    const priorityOrder: Record<DecisionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function getDecisionById(decisionId: string): StrategicDecision | undefined {
  return decisionStore.get(decisionId);
}

export async function approveDecision(decisionId: string): Promise<StrategicDecision | null> {
  const decision = decisionStore.get(decisionId);
  if (!decision) return null;
  if (decision.status !== "proposed") return null;

  decision.status = "approved";
  decision.updatedAt = new Date().toISOString();
  decisionStore.set(decisionId, decision);

  try {
    const pool = getPool();
    if (pool) {
      await pool.query(
        `UPDATE lead_os_strategy_decisions SET status = $1, updated_at = $2 WHERE id = $3`,
        [decision.status, decision.updatedAt, decisionId],
      );
    }
  } catch {
    // in-memory fallback
  }

  return decision;
}

export async function executeDecision(decisionId: string): Promise<StrategicDecision | null> {
  const decision = decisionStore.get(decisionId);
  if (!decision) return null;
  if (decision.status !== "approved") return null;

  decision.status = "executing";
  decision.updatedAt = new Date().toISOString();
  decisionStore.set(decisionId, decision);

  try {
    const pool = getPool();
    if (pool) {
      await pool.query(
        `UPDATE lead_os_strategy_decisions SET status = $1, updated_at = $2 WHERE id = $3`,
        [decision.status, decision.updatedAt, decisionId],
      );
    }
  } catch {
    // in-memory fallback
  }

  return decision;
}

// ---------------------------------------------------------------------------
// Strategic Plan Generation
// ---------------------------------------------------------------------------

export async function generateStrategicPlan(
  tenantId: string,
  nicheRevenues: Record<string, number>,
  nicheConversions: Record<string, number>,
  channelData: Array<{ channel: string; roi: number; trend: string; volume: number; cost: number }>,
  offerData: Array<{ offer: string; revenue: number; views: number; conversions: number; cost: number }>,
  metrics: { leadVolume: number; avgDealValue: number; buyerCount: number },
): Promise<StrategicPlan> {
  const nicheEvals = evaluateNichePortfolio(tenantId, nicheRevenues, nicheConversions);
  const channelEvals = evaluateChannelStrategy(tenantId, channelData);
  const offerEvals = evaluateOfferStrategy(tenantId, offerData);
  const modelFits = evaluateRevenueModelFit(tenantId, metrics);

  const decisions: StrategicDecision[] = [];

  for (const ne of nicheEvals) {
    if (ne.recommendation === "expand") {
      const d = await createDecision(
        tenantId,
        "niche-expand",
        `Expand into ${ne.niche} niche`,
        ne.rationale,
        { revenue: Math.round(ne.revenue * 0.5), timeframe: "90 days" },
        0.75,
        "high",
      );
      decisions.push(d);
    } else if (ne.recommendation === "contract") {
      const d = await createDecision(
        tenantId,
        "niche-contract",
        `Reduce investment in ${ne.niche} niche`,
        ne.rationale,
        { revenue: Math.round(ne.revenue * -0.3), timeframe: "60 days" },
        0.7,
        "medium",
      );
      decisions.push(d);
    }
  }

  for (const ce of channelEvals) {
    if (ce.recommendation === "scale") {
      const d = await createDecision(
        tenantId,
        "channel-scale",
        `Scale ${ce.channel} channel spend`,
        ce.rationale,
        { revenue: Math.round(ce.roi * 1000), timeframe: "60 days" },
        0.8,
        "high",
      );
      decisions.push(d);
    } else if (ce.recommendation === "kill") {
      const d = await createDecision(
        tenantId,
        "channel-kill",
        `Kill ${ce.channel} channel`,
        ce.rationale,
        { revenue: 0, timeframe: "30 days" },
        0.85,
        "medium",
      );
      decisions.push(d);
    }
  }

  for (const oe of offerEvals) {
    if (oe.recommendation === "push") {
      const d = await createDecision(
        tenantId,
        "offer-push",
        `Push ${oe.offer} offer aggressively`,
        oe.rationale,
        { revenue: Math.round(oe.revenuePerView * 500), timeframe: "45 days" },
        0.7,
        "high",
      );
      decisions.push(d);
    } else if (oe.recommendation === "retire") {
      const d = await createDecision(
        tenantId,
        "offer-retire",
        `Retire ${oe.offer} offer`,
        oe.rationale,
        { revenue: 0, timeframe: "30 days" },
        0.65,
        "low",
      );
      decisions.push(d);
    }
  }

  const topModel = modelFits.find((m) => m.recommended);
  if (topModel && topModel.fitScore > 0.7) {
    const d = await createDecision(
      tenantId,
      "model-shift",
      `Shift primary revenue model to ${topModel.model}`,
      topModel.rationale,
      { revenue: Math.round(metrics.avgDealValue * metrics.leadVolume * 0.1), timeframe: "120 days" },
      topModel.fitScore,
      "critical",
    );
    decisions.push(d);
  }

  const summaryParts: string[] = [];
  const expandCount = nicheEvals.filter((n) => n.recommendation === "expand").length;
  const contractCount = nicheEvals.filter((n) => n.recommendation === "contract").length;
  const scaleCount = channelEvals.filter((c) => c.recommendation === "scale").length;
  const killCount = channelEvals.filter((c) => c.recommendation === "kill").length;

  if (expandCount > 0) summaryParts.push(`Expand ${expandCount} niche(s)`);
  if (contractCount > 0) summaryParts.push(`Contract ${contractCount} niche(s)`);
  if (scaleCount > 0) summaryParts.push(`Scale ${scaleCount} channel(s)`);
  if (killCount > 0) summaryParts.push(`Kill ${killCount} channel(s)`);
  if (topModel) summaryParts.push(`Consider ${topModel.model} model`);

  const plan: StrategicPlan = {
    tenantId,
    decisions,
    generatedAt: new Date().toISOString(),
    summary: summaryParts.length > 0 ? summaryParts.join(". ") + "." : "No strategic changes recommended at this time.",
  };

  planCounter += 1;
  planStore.set(`plan_${tenantId}_${planCounter}`, plan);

  return plan;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  decisionStore.clear();
  planStore.clear();
  decisionCounter = 0;
  planCounter = 0;
}

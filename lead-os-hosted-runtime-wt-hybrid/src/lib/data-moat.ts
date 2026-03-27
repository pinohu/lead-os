import { queryPostgres, getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BehaviorPattern {
  id: string;
  tenantId: string;
  niche: string;
  behaviorType: string;
  funnelStage: string;
  pattern: string;
  sampleSize: number;
  confidence: number;
  liftMultiplier: number;
  discoveredAt: string;
  lastSeenAt: string;
}

export interface ConversionPath {
  id: string;
  tenantId: string;
  niche: string;
  leadId: string;
  touchpoints: ConversionTouchpoint[];
  totalDurationHours: number;
  convertedAt: string;
}

export interface ConversionTouchpoint {
  channel: string;
  action: string;
  funnelStage: string;
  timestampIso: string;
}

export interface NicheBenchmark {
  niche: string;
  avgTimeToConvertHours: number;
  avgTouchpoints: number;
  topChannels: { channel: string; percentage: number }[];
  topFunnelStages: { stage: string; percentage: number }[];
  conversionRate: number;
  sampleSize: number;
}

export interface NicheInsight {
  niche: string;
  bestOffers: string[];
  optimalFollowUpHours: number;
  topObjections: string[];
  conversionRateBySource: Record<string, number>;
  avgLeadValue: number;
  tenantCount: number;
}

export interface BluOceanNiche {
  niche: string;
  conversionRate: number;
  tenantCount: number;
  avgLeadValue: number;
  competitionScore: number;
  opportunityScore: number;
}

export interface DataMoatScore {
  tenantId: string;
  score: number;
  patternCount: number;
  conversionPathCount: number;
  daysInSystem: number;
  nichesCovered: number;
  calculatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const patternStore: Map<string, BehaviorPattern> = new Map();
const conversionPathStore: Map<string, ConversionPath> = new Map();
const socialProofEventLog: { tenantId: string; event: string; timestamp: string }[] = [];

let patternIdCounter = 0;
let pathIdCounter = 0;

function generatePatternId(): string {
  patternIdCounter += 1;
  return `pat_${Date.now()}_${patternIdCounter}`;
}

function generatePathId(): string {
  pathIdCounter += 1;
  return `cp_${Date.now()}_${pathIdCounter}`;
}

// ---------------------------------------------------------------------------
// Behavioral Pattern Database
// ---------------------------------------------------------------------------

export async function recordBehaviorPattern(
  tenantId: string,
  niche: string,
  pattern: Omit<BehaviorPattern, "id" | "tenantId" | "niche" | "discoveredAt" | "lastSeenAt">,
): Promise<BehaviorPattern> {
  const now = new Date().toISOString();
  const entry: BehaviorPattern = {
    id: generatePatternId(),
    tenantId,
    niche,
    behaviorType: pattern.behaviorType,
    funnelStage: pattern.funnelStage,
    pattern: pattern.pattern,
    sampleSize: pattern.sampleSize,
    confidence: pattern.confidence,
    liftMultiplier: pattern.liftMultiplier,
    discoveredAt: now,
    lastSeenAt: now,
  };

  patternStore.set(entry.id, entry);

  if (getPool()) {
    await queryPostgres(
      `INSERT INTO data_moat_patterns (id, tenant_id, niche, behavior_type, funnel_stage, pattern, sample_size, confidence, lift_multiplier, discovered_at, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, tenantId, niche, entry.behaviorType, entry.funnelStage, entry.pattern, entry.sampleSize, entry.confidence, entry.liftMultiplier, entry.discoveredAt, entry.lastSeenAt],
    );
  }

  return entry;
}

export function queryPatterns(
  niche: string,
  filters?: { behaviorType?: string; funnelStage?: string; minConfidence?: number },
): BehaviorPattern[] {
  const results: BehaviorPattern[] = [];
  for (const p of Array.from(patternStore.values())) {
    if (p.niche !== niche) continue;
    if (filters?.behaviorType && p.behaviorType !== filters.behaviorType) continue;
    if (filters?.funnelStage && p.funnelStage !== filters.funnelStage) continue;
    if (filters?.minConfidence !== undefined && p.confidence < filters.minConfidence) continue;
    results.push(p);
  }
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Chi-squared approximation for independence test.
 * Returns approximate p-value for a 2x2 contingency table.
 */
function chiSquaredPValue(observed: number, expected: number, total: number): number {
  if (expected === 0 || total === 0) return 1;
  const chiSq = ((observed - expected) ** 2) / expected;
  // Approximate p-value using the complementary CDF of chi-squared(1).
  // For df=1, P(X > x) ~ exp(-x/2) is a rough upper-bound approximation.
  return Math.exp(-chiSq / 2);
}

export function detectEmergingPattern(
  tenantId: string,
  events: { action: string; converted: boolean; funnelStage: string }[],
  minConfidence: number = 0.95,
): BehaviorPattern[] {
  if (events.length < 30) return [];

  const actionGroups = new Map<string, { total: number; converted: number; stage: string }>();
  for (const e of events) {
    const key = e.action;
    const group = actionGroups.get(key) ?? { total: 0, converted: 0, stage: e.funnelStage };
    group.total += 1;
    if (e.converted) group.converted += 1;
    actionGroups.set(key, group);
  }

  const totalEvents = events.length;
  const totalConverted = events.filter((e) => e.converted).length;
  const baseRate = totalConverted / totalEvents;

  const detected: BehaviorPattern[] = [];
  const now = new Date().toISOString();

  for (const [action, group] of Array.from(actionGroups.entries())) {
    if (group.total < 5) continue;

    const actionRate = group.converted / group.total;
    const expected = baseRate * group.total;
    const pValue = chiSquaredPValue(group.converted, expected, group.total);
    const confidence = 1 - pValue;

    if (confidence >= minConfidence && actionRate > baseRate) {
      const lift = baseRate > 0 ? actionRate / baseRate : 1;
      const pattern: BehaviorPattern = {
        id: generatePatternId(),
        tenantId,
        niche: "auto-detected",
        behaviorType: "emerging",
        funnelStage: group.stage,
        pattern: `Users who "${action}" convert at ${(actionRate * 100).toFixed(1)}% vs base ${(baseRate * 100).toFixed(1)}%`,
        sampleSize: group.total,
        confidence: Math.round(confidence * 1000) / 1000,
        liftMultiplier: Math.round(lift * 100) / 100,
        discoveredAt: now,
        lastSeenAt: now,
      };
      patternStore.set(pattern.id, pattern);
      detected.push(pattern);
    }
  }

  return detected;
}

// ---------------------------------------------------------------------------
// Conversion Intelligence
// ---------------------------------------------------------------------------

export async function recordConversionPath(
  tenantId: string,
  leadId: string,
  niche: string,
  touchpoints: ConversionTouchpoint[],
): Promise<ConversionPath> {
  const sorted = [...touchpoints].sort(
    (a, b) => new Date(a.timestampIso).getTime() - new Date(b.timestampIso).getTime(),
  );

  const firstTouch = sorted.length > 0 ? new Date(sorted[0].timestampIso).getTime() : Date.now();
  const lastTouch = sorted.length > 0 ? new Date(sorted[sorted.length - 1].timestampIso).getTime() : Date.now();
  const durationHours = (lastTouch - firstTouch) / (1000 * 60 * 60);

  const entry: ConversionPath = {
    id: generatePathId(),
    tenantId,
    niche,
    leadId,
    touchpoints: sorted,
    totalDurationHours: Math.round(durationHours * 100) / 100,
    convertedAt: new Date().toISOString(),
  };

  conversionPathStore.set(entry.id, entry);

  if (getPool()) {
    await queryPostgres(
      `INSERT INTO data_moat_conversion_paths (id, tenant_id, niche, lead_id, touchpoints, total_duration_hours, converted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, tenantId, niche, leadId, JSON.stringify(sorted), entry.totalDurationHours, entry.convertedAt],
    );
  }

  return entry;
}

export function getTopConversionPaths(
  niche: string,
  limit: number = 10,
): { sequence: string[]; count: number; avgDurationHours: number }[] {
  const pathsByNiche: ConversionPath[] = [];
  for (const cp of Array.from(conversionPathStore.values())) {
    if (cp.niche === niche) pathsByNiche.push(cp);
  }

  const sequenceMap = new Map<string, { count: number; totalDuration: number }>();
  for (const cp of pathsByNiche) {
    const key = cp.touchpoints.map((t) => `${t.channel}:${t.action}`).join(" -> ");
    const entry = sequenceMap.get(key) ?? { count: 0, totalDuration: 0 };
    entry.count += 1;
    entry.totalDuration += cp.totalDurationHours;
    sequenceMap.set(key, entry);
  }

  return Array.from(sequenceMap.entries())
    .map(([seq, data]) => ({
      sequence: seq.split(" -> "),
      count: data.count,
      avgDurationHours: Math.round((data.totalDuration / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getConversionBenchmarks(niche: string): NicheBenchmark {
  const paths: ConversionPath[] = [];
  for (const cp of Array.from(conversionPathStore.values())) {
    if (cp.niche === niche) paths.push(cp);
  }

  if (paths.length === 0) {
    return {
      niche,
      avgTimeToConvertHours: 0,
      avgTouchpoints: 0,
      topChannels: [],
      topFunnelStages: [],
      conversionRate: 0,
      sampleSize: 0,
    };
  }

  const totalDuration = paths.reduce((sum, p) => sum + p.totalDurationHours, 0);
  const totalTouchpoints = paths.reduce((sum, p) => sum + p.touchpoints.length, 0);

  const channelCounts = new Map<string, number>();
  const stageCounts = new Map<string, number>();
  let touchpointTotal = 0;

  for (const cp of paths) {
    for (const tp of cp.touchpoints) {
      channelCounts.set(tp.channel, (channelCounts.get(tp.channel) ?? 0) + 1);
      stageCounts.set(tp.funnelStage, (stageCounts.get(tp.funnelStage) ?? 0) + 1);
      touchpointTotal += 1;
    }
  }

  const topChannels = Array.from(channelCounts.entries())
    .map(([channel, count]) => ({
      channel,
      percentage: touchpointTotal > 0 ? Math.round((count / touchpointTotal) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const topFunnelStages = Array.from(stageCounts.entries())
    .map(([stage, count]) => ({
      stage,
      percentage: touchpointTotal > 0 ? Math.round((count / touchpointTotal) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  return {
    niche,
    avgTimeToConvertHours: Math.round((totalDuration / paths.length) * 100) / 100,
    avgTouchpoints: Math.round((totalTouchpoints / paths.length) * 100) / 100,
    topChannels,
    topFunnelStages,
    conversionRate: 0,
    sampleSize: paths.length,
  };
}

export function predictConversionProbability(
  lead: { actions: string[]; source: string; funnelStage: string },
  patterns: BehaviorPattern[],
): number {
  if (patterns.length === 0) return 0.1;

  let score = 0.1;
  for (const p of patterns) {
    const matchesStage = p.funnelStage === lead.funnelStage;
    const matchesAction = lead.actions.some((a) => p.pattern.toLowerCase().includes(a.toLowerCase()));

    if (matchesStage && matchesAction) {
      score += p.liftMultiplier * p.confidence * 0.15;
    } else if (matchesStage || matchesAction) {
      score += p.liftMultiplier * p.confidence * 0.05;
    }
  }

  return Math.min(1, Math.max(0, Math.round(score * 1000) / 1000));
}

// ---------------------------------------------------------------------------
// Niche Intelligence
// ---------------------------------------------------------------------------

export function getNicheInsights(niche: string): NicheInsight {
  const patterns = queryPatterns(niche);
  const paths: ConversionPath[] = [];
  const tenantIds = new Set<string>();

  for (const cp of Array.from(conversionPathStore.values())) {
    if (cp.niche === niche) {
      paths.push(cp);
      tenantIds.add(cp.tenantId);
    }
  }
  for (const p of patterns) {
    tenantIds.add(p.tenantId);
  }

  const sourceConversions = new Map<string, { total: number; converted: number }>();
  for (const cp of paths) {
    for (const tp of cp.touchpoints) {
      const entry = sourceConversions.get(tp.channel) ?? { total: 0, converted: 0 };
      entry.total += 1;
      entry.converted += 1;
      sourceConversions.set(tp.channel, entry);
    }
  }

  const conversionRateBySource: Record<string, number> = {};
  for (const [channel, data] of Array.from(sourceConversions.entries())) {
    conversionRateBySource[channel] = data.total > 0
      ? Math.round((data.converted / data.total) * 10000) / 100
      : 0;
  }

  const topObjections = deriveTopObjections(niche);
  const bestOffers = deriveBestOffers(niche);

  return {
    niche,
    bestOffers,
    optimalFollowUpHours: paths.length > 0
      ? Math.round((paths.reduce((s, p) => s + p.totalDurationHours, 0) / paths.length / 3) * 100) / 100
      : 24,
    topObjections,
    conversionRateBySource,
    avgLeadValue: estimateLeadValue(niche),
    tenantCount: tenantIds.size,
  };
}

function deriveTopObjections(niche: string): string[] {
  const objectionMap: Record<string, string[]> = {
    construction: ["Too expensive", "Timeline concerns", "Quality assurance", "License verification"],
    legal: ["Cost uncertainty", "Case outcome doubts", "Communication frequency", "Experience level"],
    dental: ["Insurance coverage", "Pain concerns", "Treatment necessity", "Cost transparency"],
    hvac: ["Upfront cost", "Warranty coverage", "Emergency availability", "Brand preference"],
    roofing: ["Material quality", "Weather delays", "Cost vs DIY", "Permit requirements"],
  };
  return objectionMap[niche.toLowerCase()] ?? ["Price concerns", "Trust issues", "Timing", "Competitor comparison"];
}

function deriveBestOffers(niche: string): string[] {
  const offerMap: Record<string, string[]> = {
    construction: ["Free estimate", "10% off first project", "Free consultation"],
    legal: ["Free 30-min consultation", "No-win no-fee", "Free case review"],
    dental: ["Free whitening with cleaning", "New patient special", "Free exam"],
    hvac: ["Free diagnostic", "Seasonal tune-up deal", "$50 off first service"],
    roofing: ["Free roof inspection", "Storm damage assessment", "Financing available"],
  };
  return offerMap[niche.toLowerCase()] ?? ["Free consultation", "10% first-time discount", "Free assessment"];
}

function estimateLeadValue(niche: string): number {
  const valueMap: Record<string, number> = {
    construction: 15000,
    legal: 5000,
    dental: 1200,
    hvac: 3500,
    roofing: 8000,
    plumbing: 2000,
    electrical: 2500,
    landscaping: 4000,
  };
  return valueMap[niche.toLowerCase()] ?? 3000;
}

export function compareNichePerformance(
  niches: string[],
): { niche: string; conversionRate: number; avgTouchpoints: number; avgTimeToConvertHours: number; tenantCount: number }[] {
  return niches.map((niche) => {
    const benchmarks = getConversionBenchmarks(niche);
    const insights = getNicheInsights(niche);
    return {
      niche,
      conversionRate: benchmarks.conversionRate,
      avgTouchpoints: benchmarks.avgTouchpoints,
      avgTimeToConvertHours: benchmarks.avgTimeToConvertHours,
      tenantCount: insights.tenantCount,
    };
  });
}

export function identifyBluOceanNiche(
  allNicheData: { niche: string; conversionRate: number; tenantCount: number; avgLeadValue: number }[],
): BluOceanNiche[] {
  if (allNicheData.length === 0) return [];

  const maxTenants = Math.max(...allNicheData.map((d) => d.tenantCount), 1);

  return allNicheData
    .map((d) => {
      const competitionScore = Math.round((d.tenantCount / maxTenants) * 100);
      const revenueSignal = d.conversionRate * d.avgLeadValue;
      const maxRevenueSignal = Math.max(...allNicheData.map((n) => n.conversionRate * n.avgLeadValue), 1);
      const opportunityScore = Math.round(
        ((revenueSignal / maxRevenueSignal) * 70) + ((1 - competitionScore / 100) * 30),
      );

      return {
        niche: d.niche,
        conversionRate: d.conversionRate,
        tenantCount: d.tenantCount,
        avgLeadValue: d.avgLeadValue,
        competitionScore,
        opportunityScore: Math.min(100, Math.max(0, opportunityScore)),
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// ---------------------------------------------------------------------------
// Data Compounding
// ---------------------------------------------------------------------------

export async function runDataCompaction(tenantId: string): Promise<{ compacted: number }> {
  const tenantPatterns: BehaviorPattern[] = [];
  for (const p of Array.from(patternStore.values())) {
    if (p.tenantId === tenantId) tenantPatterns.push(p);
  }

  const grouped = new Map<string, BehaviorPattern[]>();
  for (const p of tenantPatterns) {
    const key = `${p.niche}:${p.behaviorType}:${p.funnelStage}`;
    const group = grouped.get(key) ?? [];
    group.push(p);
    grouped.set(key, group);
  }

  let compacted = 0;
  for (const [, group] of Array.from(grouped.entries())) {
    if (group.length <= 1) continue;

    group.sort((a, b) => b.confidence - a.confidence);
    const best = group[0];
    const mergedSampleSize = group.reduce((sum, p) => sum + p.sampleSize, 0);
    const avgConfidence = group.reduce((sum, p) => sum + p.confidence, 0) / group.length;
    const avgLift = group.reduce((sum, p) => sum + p.liftMultiplier, 0) / group.length;

    best.sampleSize = mergedSampleSize;
    best.confidence = Math.round(avgConfidence * 1000) / 1000;
    best.liftMultiplier = Math.round(avgLift * 100) / 100;
    best.lastSeenAt = new Date().toISOString();

    for (let i = 1; i < group.length; i++) {
      patternStore.delete(group[i].id);
      compacted += 1;
    }
  }

  return { compacted };
}

export function calculateDataMoatScore(tenantId: string): DataMoatScore {
  let patternCount = 0;
  let conversionPathCount = 0;
  const niches = new Set<string>();
  let earliestDate = Date.now();

  for (const p of Array.from(patternStore.values())) {
    if (p.tenantId === tenantId) {
      patternCount += 1;
      niches.add(p.niche);
      const d = new Date(p.discoveredAt).getTime();
      if (d < earliestDate) earliestDate = d;
    }
  }

  for (const cp of Array.from(conversionPathStore.values())) {
    if (cp.tenantId === tenantId) {
      conversionPathCount += 1;
      niches.add(cp.niche);
      const d = new Date(cp.convertedAt).getTime();
      if (d < earliestDate) earliestDate = d;
    }
  }

  const daysInSystem = patternCount > 0 || conversionPathCount > 0
    ? Math.max(1, Math.round((Date.now() - earliestDate) / (1000 * 60 * 60 * 24)))
    : 0;

  const patternScore = Math.min(30, patternCount * 3);
  const pathScore = Math.min(30, conversionPathCount * 2);
  const timeScore = Math.min(20, daysInSystem * 0.5);
  const nicheScore = Math.min(20, niches.size * 5);

  const score = Math.min(100, Math.round(patternScore + pathScore + timeScore + nicheScore));

  return {
    tenantId,
    score,
    patternCount,
    conversionPathCount,
    daysInSystem,
    nichesCovered: niches.size,
    calculatedAt: new Date().toISOString(),
  };
}

export function exportAnonymizedBenchmarks(niche: string): NicheBenchmark & { anonymized: true } {
  const benchmarks = getConversionBenchmarks(niche);
  return { ...benchmarks, anonymized: true as const };
}

// ---------------------------------------------------------------------------
// Test helpers (for clearing in-memory state between tests)
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  patternStore.clear();
  conversionPathStore.clear();
  socialProofEventLog.length = 0;
  patternIdCounter = 0;
  pathIdCounter = 0;
}

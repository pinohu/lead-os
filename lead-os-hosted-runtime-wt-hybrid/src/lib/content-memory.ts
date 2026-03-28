import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentMetrics {
  impressions: number;
  views: number;
  watchTimeAvg: number;
  ctr: number;
  engagementRate: number;
  shares: number;
  saves: number;
  comments: number;
  leads: number;
  conversions: number;
  revenuePerView: number;
}

export interface ContentRecord {
  id: string;
  tenantId: string;
  assetId: string;
  platform: string;
  hook: string;
  angle: string;
  type: "viral" | "conversion";
  metrics: ContentMetrics;
  revenueGenerated: number;
  status: "active" | "scaled" | "killed" | "paused";
  createdAt: string;
  updatedAt: string;
}

export type ContentDecision = "scale" | "maintain" | "optimize" | "kill";

export interface ContentPattern {
  topHooks: string[];
  topAngles: string[];
  topPlatforms: string[];
  bestPostingTimes: string[];
}

export interface AvoidEntry {
  assetId: string;
  hook: string;
  angle: string;
  platform: string;
  killedAt: string;
  reason: string;
}

export interface ContentInsights {
  topPerformers: ContentRecord[];
  patterns: ContentPattern;
  avoidList: AvoidEntry[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const SCALE_THRESHOLDS = {
  engagementRate: 0.05,
  ctr: 0.03,
  revenuePerView: 0.5,
};

const KILL_THRESHOLDS = {
  engagementRate: 0.01,
  ctr: 0.005,
  minImpressions: 1000,
};

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const contentStore = new Map<string, ContentRecord>();

function generateId(): string {
  return `content-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function persistRecord(record: ContentRecord): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO content_memory (
      id, tenant_id, asset_id, platform, hook, angle, type,
      metrics, revenue_generated, status, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id) DO UPDATE SET
      metrics = EXCLUDED.metrics,
      revenue_generated = EXCLUDED.revenue_generated,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at`,
    [
      record.id,
      record.tenantId,
      record.assetId,
      record.platform,
      record.hook,
      record.angle,
      record.type,
      JSON.stringify(record.metrics),
      record.revenueGenerated,
      record.status,
      record.createdAt,
      record.updatedAt,
    ],
  );
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function recordContent(
  tenantId: string,
  asset: Omit<ContentRecord, "id" | "tenantId" | "createdAt" | "updatedAt" | "status">,
): Promise<ContentRecord> {
  const now = new Date().toISOString();
  const record: ContentRecord = {
    ...asset,
    id: generateId(),
    tenantId,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  contentStore.set(record.id, record);
  await persistRecord(record);
  return record;
}

export async function updateMetrics(
  assetId: string,
  metrics: Partial<ContentMetrics>,
): Promise<ContentRecord | undefined> {
  const record = [...contentStore.values()].find((r) => r.assetId === assetId);
  if (!record) return undefined;
  const updated: ContentRecord = {
    ...record,
    metrics: { ...record.metrics, ...metrics },
    updatedAt: new Date().toISOString(),
  };
  contentStore.set(record.id, updated);
  await persistRecord(updated);
  return updated;
}

export function evaluateContent(assetId: string): ContentDecision {
  const record = [...contentStore.values()].find((r) => r.assetId === assetId);
  if (!record) return "kill";

  const { metrics } = record;

  const isKill =
    metrics.impressions >= KILL_THRESHOLDS.minImpressions &&
    metrics.engagementRate < KILL_THRESHOLDS.engagementRate &&
    metrics.ctr < KILL_THRESHOLDS.ctr;

  if (isKill) return "kill";

  const isScale =
    metrics.engagementRate >= SCALE_THRESHOLDS.engagementRate &&
    metrics.ctr >= SCALE_THRESHOLDS.ctr &&
    metrics.revenuePerView >= SCALE_THRESHOLDS.revenuePerView;

  if (isScale) return "scale";

  const isMaintain =
    metrics.engagementRate >= KILL_THRESHOLDS.engagementRate * 2 &&
    metrics.ctr >= KILL_THRESHOLDS.ctr * 2;

  if (isMaintain) return "maintain";

  return "optimize";
}

export function getTopPerformers(
  tenantId: string,
  limit = 10,
  metric: keyof ContentMetrics = "engagementRate",
): ContentRecord[] {
  return [...contentStore.values()]
    .filter((r) => r.tenantId === tenantId && r.status !== "killed")
    .sort((a, b) => b.metrics[metric] - a.metrics[metric])
    .slice(0, limit);
}

export function getContentPatterns(tenantId: string): ContentPattern {
  const records = [...contentStore.values()].filter(
    (r) => r.tenantId === tenantId && r.status !== "killed",
  );

  const hookScores = new Map<string, number>();
  const angleScores = new Map<string, number>();
  const platformScores = new Map<string, number>();

  for (const r of records) {
    const score = r.metrics.engagementRate + r.metrics.ctr + r.metrics.revenuePerView;
    hookScores.set(r.hook, (hookScores.get(r.hook) ?? 0) + score);
    angleScores.set(r.angle, (angleScores.get(r.angle) ?? 0) + score);
    platformScores.set(r.platform, (platformScores.get(r.platform) ?? 0) + score);
  }

  const sortMap = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

  return {
    topHooks: sortMap(hookScores).slice(0, 5),
    topAngles: sortMap(angleScores).slice(0, 5),
    topPlatforms: sortMap(platformScores).slice(0, 3),
    bestPostingTimes: ["9am", "12pm", "6pm"],
  };
}

export function getAvoidList(tenantId: string): AvoidEntry[] {
  return [...contentStore.values()]
    .filter((r) => r.tenantId === tenantId && r.status === "killed")
    .map((r) => ({
      assetId: r.assetId,
      hook: r.hook,
      angle: r.angle,
      platform: r.platform,
      killedAt: r.updatedAt,
      reason: buildKillReason(r.metrics),
    }));
}

function buildKillReason(metrics: ContentMetrics): string {
  const reasons: string[] = [];
  if (metrics.ctr < KILL_THRESHOLDS.ctr) reasons.push("low CTR");
  if (metrics.engagementRate < KILL_THRESHOLDS.engagementRate) reasons.push("low engagement");
  if (metrics.revenuePerView === 0) reasons.push("zero revenue");
  return reasons.length > 0 ? reasons.join(", ") : "underperforming";
}

export function generateContentInsights(tenantId: string): ContentInsights {
  const topPerformers = getTopPerformers(tenantId, 5);
  const patterns = getContentPatterns(tenantId);
  const avoidList = getAvoidList(tenantId);

  const recommendations: string[] = [];

  if (patterns.topHooks.length > 0) {
    recommendations.push(`Use hook style "${patterns.topHooks[0]}" — highest engagement score.`);
  }
  if (patterns.topPlatforms.length > 0) {
    recommendations.push(
      `Prioritize ${patterns.topPlatforms[0]} for distribution — best ROI.`,
    );
  }
  if (avoidList.length > 0) {
    recommendations.push(
      `Avoid angle "${avoidList[0].angle}" — killed due to ${avoidList[0].reason}.`,
    );
  }
  if (topPerformers.length > 0 && topPerformers[0].metrics.engagementRate >= SCALE_THRESHOLDS.engagementRate) {
    recommendations.push(`Scale asset ${topPerformers[0].assetId} — meets all scale thresholds.`);
  }

  return { topPerformers, patterns, avoidList, recommendations };
}

export function resetContentMemory(): void {
  contentStore.clear();
}

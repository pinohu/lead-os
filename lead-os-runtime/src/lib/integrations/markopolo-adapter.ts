import type { ProviderResult } from "../providers.ts";
import { getPool } from "../db.ts";

// ---------------------------------------------------------------------------
// Markopolo.ai Ad Targeting Types
// ---------------------------------------------------------------------------

export interface MarkoPoloConfig {
  apiKey: string;
  baseUrl: string;
}

export type AdPlatform = "facebook" | "google" | "tiktok" | "snapchat" | "linkedin";

export interface AdAudience {
  id: string;
  name: string;
  platform: AdPlatform;
  size: number;
  type: "lookalike" | "retargeting" | "custom" | "interest";
  sourceData?: string;
  tenantId?: string;
  createdAt: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: AdPlatform;
  audienceId: string;
  budget: number;
  budgetType: "daily" | "lifetime";
  status: "active" | "paused" | "completed" | "draft";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  roas: number;
  tenantId?: string;
  createdAt: string;
}

export interface AudienceSync {
  id: string;
  audienceId: string;
  platform: AdPlatform;
  status: "syncing" | "synced" | "failed";
  matchRate: number;
  syncedAt: string;
}

export interface AdOptimization {
  campaignId: string;
  recommendations: {
    type: string;
    description: string;
    impact: "high" | "medium" | "low";
    action: string;
  }[];
  predictedImprovement: number;
}

export interface MarkoPoloStats {
  totalAudiences: number;
  totalCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  avgCpa: number;
  avgRoas: number;
  byPlatform: Record<AdPlatform, { spend: number; conversions: number; roas: number }>;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const audienceStore = new Map<string, AdAudience>();
const campaignStore = new Map<string, AdCampaign>();
const syncStore = new Map<string, AudienceSync>();

let schemaEnsured = false;

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

export function resolveMarkoPoloConfig(): MarkoPoloConfig | null {
  const apiKey = process.env.MARKOPOLO_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.MARKOPOLO_BASE_URL ?? "https://api.markopolo.ai/v1",
  };
}

export function isMarkoPoloDryRun(): boolean {
  return !process.env.MARKOPOLO_API_KEY;
}

// ---------------------------------------------------------------------------
// Schema (lazy-init)
// ---------------------------------------------------------------------------

async function ensureMarkoPoloSchema(): Promise<void> {
  if (schemaEnsured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_os_markopolo (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tenant_id TEXT,
        platform TEXT,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    schemaEnsured = true;
  } catch {
    // Schema creation failed — fall back to in-memory only
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function persistRecord(id: string, type: string, tenantId: string | undefined, platform: string | undefined, payload: unknown): Promise<void> {
  await ensureMarkoPoloSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_markopolo (id, type, tenant_id, platform, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE
       SET type = EXCLUDED.type,
           tenant_id = EXCLUDED.tenant_id,
           platform = EXCLUDED.platform,
           payload = EXCLUDED.payload`,
      [id, type, tenantId ?? null, platform ?? null, JSON.stringify(payload)],
    );
  } catch {
    // DB write failed — in-memory store is still valid
  }
}

// ---------------------------------------------------------------------------
// Deterministic seeded random for dry-run
// ---------------------------------------------------------------------------

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Audiences
// ---------------------------------------------------------------------------

export async function createAudience(input: {
  name: string;
  platform: AdPlatform;
  size: number;
  type: "lookalike" | "retargeting" | "custom" | "interest";
  sourceData?: string;
  tenantId?: string;
}): Promise<AdAudience> {
  const audience: AdAudience = {
    id: crypto.randomUUID(),
    name: input.name,
    platform: input.platform,
    size: input.size,
    type: input.type,
    sourceData: input.sourceData,
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  audienceStore.set(audience.id, audience);
  await persistRecord(audience.id, "audience", audience.tenantId, audience.platform, audience);

  return audience;
}

export async function listAudiences(tenantId?: string): Promise<AdAudience[]> {
  const all = [...audienceStore.values()];
  if (!tenantId) return all;
  return all.filter((a) => a.tenantId === tenantId);
}

export async function getAudience(id: string): Promise<AdAudience | null> {
  return audienceStore.get(id) ?? null;
}

// ---------------------------------------------------------------------------
// Audience Sync
// ---------------------------------------------------------------------------

export async function syncAudienceToPlatform(audienceId: string, platform: AdPlatform): Promise<AudienceSync> {
  const audience = audienceStore.get(audienceId);
  if (!audience) {
    throw new Error(`Audience ${audienceId} not found`);
  }

  if (!isMarkoPoloDryRun()) {
    const cfg = resolveMarkoPoloConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/audiences/${audienceId}/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({ platform }),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const data = (await res.json()) as Record<string, unknown>;
          const sync: AudienceSync = {
            id: typeof data.id === "string" ? data.id : crypto.randomUUID(),
            audienceId,
            platform,
            status: "synced",
            matchRate: typeof data.matchRate === "number" ? data.matchRate : 75,
            syncedAt: new Date().toISOString(),
          };
          syncStore.set(sync.id, sync);
          await persistRecord(sync.id, "sync", audience.tenantId, platform, sync);
          return sync;
        }
      } catch {
        // Fall through to dry-run
      }
    }
  }

  // Dry-run: generate 60-85% match rate
  const seed = `${audienceId}-${platform}`;
  const matchRate = Math.round(60 + seededRandom(seed) * 25);

  const sync: AudienceSync = {
    id: crypto.randomUUID(),
    audienceId,
    platform,
    status: "synced",
    matchRate,
    syncedAt: new Date().toISOString(),
  };

  syncStore.set(sync.id, sync);
  await persistRecord(sync.id, "sync", audience.tenantId, platform, sync);

  return sync;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function createCampaign(input: {
  name: string;
  platform: AdPlatform;
  audienceId: string;
  budget: number;
  budgetType: "daily" | "lifetime";
  tenantId?: string;
}): Promise<AdCampaign> {
  const audience = audienceStore.get(input.audienceId);
  if (!audience) {
    throw new Error(`Audience ${input.audienceId} not found`);
  }

  const campaign: AdCampaign = {
    id: crypto.randomUUID(),
    name: input.name,
    platform: input.platform,
    audienceId: input.audienceId,
    budget: input.budget,
    budgetType: input.budgetType,
    status: "draft",
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cpa: 0,
    roas: 0,
    tenantId: input.tenantId,
    createdAt: new Date().toISOString(),
  };

  campaignStore.set(campaign.id, campaign);
  await persistRecord(campaign.id, "campaign", campaign.tenantId, campaign.platform, campaign);

  return campaign;
}

export async function getCampaign(id: string): Promise<AdCampaign | null> {
  return campaignStore.get(id) ?? null;
}

export async function listCampaigns(filter?: {
  platform?: AdPlatform;
  status?: AdCampaign["status"];
  tenantId?: string;
}): Promise<AdCampaign[]> {
  let all = [...campaignStore.values()];

  if (filter?.platform) {
    all = all.filter((c) => c.platform === filter.platform);
  }
  if (filter?.status) {
    all = all.filter((c) => c.status === filter.status);
  }
  if (filter?.tenantId) {
    all = all.filter((c) => c.tenantId === filter.tenantId);
  }

  return all;
}

export async function pauseCampaign(id: string): Promise<AdCampaign> {
  const campaign = campaignStore.get(id);
  if (!campaign) {
    throw new Error(`Campaign ${id} not found`);
  }
  if (campaign.status !== "active" && campaign.status !== "draft") {
    throw new Error(`Campaign ${id} cannot be paused from status ${campaign.status}`);
  }

  campaign.status = "paused";
  campaignStore.set(id, campaign);
  await persistRecord(id, "campaign", campaign.tenantId, campaign.platform, campaign);

  return campaign;
}

export async function resumeCampaign(id: string): Promise<AdCampaign> {
  const campaign = campaignStore.get(id);
  if (!campaign) {
    throw new Error(`Campaign ${id} not found`);
  }
  if (campaign.status !== "paused") {
    throw new Error(`Campaign ${id} cannot be resumed from status ${campaign.status}`);
  }

  campaign.status = "active";
  campaignStore.set(id, campaign);
  await persistRecord(id, "campaign", campaign.tenantId, campaign.platform, campaign);

  return campaign;
}

export async function updateCampaignMetrics(
  id: string,
  metrics: { impressions?: number; clicks?: number; conversions?: number; spend?: number },
): Promise<AdCampaign> {
  const campaign = campaignStore.get(id);
  if (!campaign) {
    throw new Error(`Campaign ${id} not found`);
  }

  if (metrics.impressions !== undefined) campaign.impressions += metrics.impressions;
  if (metrics.clicks !== undefined) campaign.clicks += metrics.clicks;
  if (metrics.conversions !== undefined) campaign.conversions += metrics.conversions;
  if (metrics.spend !== undefined) campaign.spend += metrics.spend;

  campaign.cpa = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0;
  campaign.roas = campaign.spend > 0 ? (campaign.conversions * 50) / campaign.spend : 0;

  campaignStore.set(id, campaign);
  await persistRecord(id, "campaign", campaign.tenantId, campaign.platform, campaign);

  return campaign;
}

// ---------------------------------------------------------------------------
// AI Optimization Suggestions
// ---------------------------------------------------------------------------

export async function getOptimizationSuggestions(campaignId: string): Promise<AdOptimization> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (!isMarkoPoloDryRun()) {
    const cfg = resolveMarkoPoloConfig();
    if (cfg) {
      try {
        const res = await fetch(`${cfg.baseUrl}/campaigns/${campaignId}/optimize`, {
          method: "GET",
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const data = (await res.json()) as AdOptimization;
          return data;
        }
      } catch {
        // Fall through to dry-run suggestions
      }
    }
  }

  // Dry-run: generate 2-4 relevant suggestions based on campaign metrics
  const recommendations: AdOptimization["recommendations"] = [];

  const ctr = campaign.impressions > 0 ? campaign.clicks / campaign.impressions : 0;

  if (ctr < 0.02) {
    recommendations.push({
      type: "creative",
      description: "Click-through rate is below 2%. Consider refreshing ad creatives with stronger headlines and clearer CTAs.",
      impact: "high",
      action: "refresh_creatives",
    });
  }

  if (campaign.cpa > campaign.budget * 0.1) {
    recommendations.push({
      type: "budget",
      description: "Cost per acquisition is high relative to budget. Narrow audience targeting or increase budget to allow algorithm optimization.",
      impact: "high",
      action: "adjust_targeting",
    });
  }

  if (campaign.roas < 2) {
    recommendations.push({
      type: "bidding",
      description: "ROAS is below 2x. Switch to value-based bidding to prioritize higher-value conversions.",
      impact: "medium",
      action: "switch_bid_strategy",
    });
  }

  recommendations.push({
    type: "audience",
    description: `Expand ${campaign.platform} audience with lookalike segments based on top converters.`,
    impact: "medium",
    action: "expand_audience",
  });

  const predictedImprovement = Math.round(10 + seededRandom(campaignId) * 25);

  return {
    campaignId,
    recommendations,
    predictedImprovement,
  };
}

// ---------------------------------------------------------------------------
// Convenience: Retargeting Audience for Landing Page
// ---------------------------------------------------------------------------

export async function createRetargetingAudience(
  name: string,
  pageUrl: string,
  tenantId?: string,
): Promise<AdAudience> {
  return createAudience({
    name,
    platform: "facebook",
    size: 0,
    type: "retargeting",
    sourceData: pageUrl,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getMarkoPoloStats(tenantId?: string): Promise<MarkoPoloStats> {
  const audiences = tenantId
    ? [...audienceStore.values()].filter((a) => a.tenantId === tenantId)
    : [...audienceStore.values()];

  const campaigns = tenantId
    ? [...campaignStore.values()].filter((c) => c.tenantId === tenantId)
    : [...campaignStore.values()];

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  const platforms: AdPlatform[] = ["facebook", "google", "tiktok", "snapchat", "linkedin"];
  const byPlatform = {} as Record<AdPlatform, { spend: number; conversions: number; roas: number }>;

  for (const p of platforms) {
    const platCampaigns = campaigns.filter((c) => c.platform === p);
    const pSpend = platCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const pConversions = platCampaigns.reduce((sum, c) => sum + c.conversions, 0);
    const pRoas = pSpend > 0 ? (pConversions * 50) / pSpend : 0;
    byPlatform[p] = { spend: pSpend, conversions: pConversions, roas: pRoas };
  }

  return {
    totalAudiences: audiences.length,
    totalCampaigns: campaigns.length,
    totalSpend,
    totalConversions,
    avgCpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    avgRoas: totalSpend > 0 ? (totalConversions * 50) / totalSpend : 0,
    byPlatform,
  };
}

// ---------------------------------------------------------------------------
// Provider bridge
// ---------------------------------------------------------------------------

export function markoPoloResult(op: string, detail: string): ProviderResult {
  return {
    ok: true,
    provider: "MarkoPolo",
    mode: isMarkoPoloDryRun() ? "dry-run" : "live",
    detail,
  };
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetMarkoPoloStore(): void {
  audienceStore.clear();
  campaignStore.clear();
  syncStore.clear();
  schemaEnsured = false;
}

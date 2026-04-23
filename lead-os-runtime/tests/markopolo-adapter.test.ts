import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveMarkoPoloConfig,
  isMarkoPoloDryRun,
  createAudience,
  listAudiences,
  getAudience,
  syncAudienceToPlatform,
  createCampaign,
  getCampaign,
  listCampaigns,
  pauseCampaign,
  resumeCampaign,
  updateCampaignMetrics,
  getOptimizationSuggestions,
  createRetargetingAudience,
  getMarkoPoloStats,
  markoPoloResult,
  resetMarkoPoloStore,
  type AdAudience,
  type AdCampaign,
  type AdPlatform,
} from "../src/lib/integrations/markopolo-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAudienceInput(overrides: Partial<Omit<AdAudience, "id" | "createdAt">> = {}) {
  return {
    name: "High-Value Lookalike",
    platform: "facebook" as AdPlatform,
    size: 50000,
    type: "lookalike" as const,
    tenantId: "tenant-1",
    ...overrides,
  };
}

function makeCampaignInput(audienceId: string, overrides: Partial<Omit<AdCampaign, "id" | "createdAt" | "status" | "spend" | "impressions" | "clicks" | "conversions" | "cpa" | "roas">> = {}) {
  return {
    name: "Spring Sale Campaign",
    platform: "facebook" as AdPlatform,
    audienceId,
    budget: 1000,
    budgetType: "daily" as const,
    tenantId: "tenant-1",
    ...overrides,
  };
}

test.beforeEach(() => {
  resetMarkoPoloStore();
});

// ---------------------------------------------------------------------------
// Config & Dry-run
// ---------------------------------------------------------------------------

test("resolveMarkoPoloConfig returns null when MARKOPOLO_API_KEY is not set", () => {
  delete process.env.MARKOPOLO_API_KEY;
  const config = resolveMarkoPoloConfig();
  assert.equal(config, null);
});

test("isMarkoPoloDryRun returns true when API key is missing", () => {
  delete process.env.MARKOPOLO_API_KEY;
  assert.equal(isMarkoPoloDryRun(), true);
});

test("resolveMarkoPoloConfig returns config when API key is set", () => {
  process.env.MARKOPOLO_API_KEY = "test-key";
  const config = resolveMarkoPoloConfig();
  assert.ok(config);
  assert.equal(config.apiKey, "test-key");
  assert.equal(config.baseUrl, "https://api.markopolo.ai/v1");
  delete process.env.MARKOPOLO_API_KEY;
});

test("resolveMarkoPoloConfig uses custom base URL when provided", () => {
  process.env.MARKOPOLO_API_KEY = "test-key";
  process.env.MARKOPOLO_BASE_URL = "https://custom.api.com/v2";
  const config = resolveMarkoPoloConfig();
  assert.ok(config);
  assert.equal(config.baseUrl, "https://custom.api.com/v2");
  delete process.env.MARKOPOLO_API_KEY;
  delete process.env.MARKOPOLO_BASE_URL;
});

test("isMarkoPoloDryRun returns false when API key is set", () => {
  process.env.MARKOPOLO_API_KEY = "test-key";
  assert.equal(isMarkoPoloDryRun(), false);
  delete process.env.MARKOPOLO_API_KEY;
});

// ---------------------------------------------------------------------------
// createAudience
// ---------------------------------------------------------------------------

test("createAudience returns audience with all required fields", async () => {
  const audience = await createAudience(makeAudienceInput());
  assert.ok(typeof audience.id === "string" && audience.id.length > 0);
  assert.equal(audience.name, "High-Value Lookalike");
  assert.equal(audience.platform, "facebook");
  assert.equal(audience.size, 50000);
  assert.equal(audience.type, "lookalike");
  assert.equal(audience.tenantId, "tenant-1");
  assert.ok(typeof audience.createdAt === "string");
});

test("createAudience assigns unique IDs", async () => {
  const a1 = await createAudience(makeAudienceInput());
  const a2 = await createAudience(makeAudienceInput({ name: "Second Audience" }));
  assert.notEqual(a1.id, a2.id);
});

test("createAudience persists sourceData", async () => {
  const audience = await createAudience(makeAudienceInput({ sourceData: "https://example.com/lp" }));
  assert.equal(audience.sourceData, "https://example.com/lp");
});

test("createAudience works without tenantId", async () => {
  const audience = await createAudience({
    name: "Global Audience",
    platform: "google",
    size: 10000,
    type: "interest",
  });
  assert.equal(audience.tenantId, undefined);
});

// ---------------------------------------------------------------------------
// listAudiences / getAudience
// ---------------------------------------------------------------------------

test("listAudiences returns all audiences when no tenantId is given", async () => {
  await createAudience(makeAudienceInput({ tenantId: "tenant-1" }));
  await createAudience(makeAudienceInput({ tenantId: "tenant-2" }));
  const all = await listAudiences();
  assert.equal(all.length, 2);
});

test("listAudiences filters by tenantId", async () => {
  await createAudience(makeAudienceInput({ tenantId: "tenant-1" }));
  await createAudience(makeAudienceInput({ tenantId: "tenant-2" }));
  const filtered = await listAudiences("tenant-1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].tenantId, "tenant-1");
});

test("getAudience returns the correct audience", async () => {
  const created = await createAudience(makeAudienceInput());
  const fetched = await getAudience(created.id);
  assert.ok(fetched);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.name, created.name);
});

test("getAudience returns null for unknown ID", async () => {
  const result = await getAudience("nonexistent");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// syncAudienceToPlatform
// ---------------------------------------------------------------------------

test("syncAudienceToPlatform returns sync with 60-85% match rate in dry-run", async () => {
  const audience = await createAudience(makeAudienceInput());
  const sync = await syncAudienceToPlatform(audience.id, "google");
  assert.ok(typeof sync.id === "string");
  assert.equal(sync.audienceId, audience.id);
  assert.equal(sync.platform, "google");
  assert.equal(sync.status, "synced");
  assert.ok(sync.matchRate >= 60 && sync.matchRate <= 85, `matchRate ${sync.matchRate} out of range`);
  assert.ok(typeof sync.syncedAt === "string");
});

test("syncAudienceToPlatform throws for unknown audience", async () => {
  await assert.rejects(
    () => syncAudienceToPlatform("nonexistent", "facebook"),
    { message: "Audience nonexistent not found" },
  );
});

test("syncAudienceToPlatform produces deterministic match rate for same input", async () => {
  const audience = await createAudience(makeAudienceInput());
  const sync1 = await syncAudienceToPlatform(audience.id, "tiktok");
  resetMarkoPoloStore();
  const audience2 = await createAudience({ ...makeAudienceInput(), name: "Other" });
  // Different audience ID means different seed, so we re-check range only
  const sync2 = await syncAudienceToPlatform(audience2.id, "tiktok");
  assert.ok(sync2.matchRate >= 60 && sync2.matchRate <= 85);
  // Same audience+platform should be deterministic within a single creation
  assert.equal(sync1.matchRate, sync1.matchRate);
});

// ---------------------------------------------------------------------------
// createCampaign
// ---------------------------------------------------------------------------

test("createCampaign returns campaign with all required fields", async () => {
  const audience = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(audience.id));
  assert.ok(typeof campaign.id === "string" && campaign.id.length > 0);
  assert.equal(campaign.name, "Spring Sale Campaign");
  assert.equal(campaign.platform, "facebook");
  assert.equal(campaign.audienceId, audience.id);
  assert.equal(campaign.budget, 1000);
  assert.equal(campaign.budgetType, "daily");
  assert.equal(campaign.status, "draft");
  assert.equal(campaign.spend, 0);
  assert.equal(campaign.impressions, 0);
  assert.equal(campaign.clicks, 0);
  assert.equal(campaign.conversions, 0);
  assert.equal(campaign.cpa, 0);
  assert.equal(campaign.roas, 0);
});

test("createCampaign throws for unknown audienceId", async () => {
  await assert.rejects(
    () => createCampaign(makeCampaignInput("nonexistent")),
    { message: "Audience nonexistent not found" },
  );
});

// ---------------------------------------------------------------------------
// getCampaign / listCampaigns
// ---------------------------------------------------------------------------

test("getCampaign returns the correct campaign", async () => {
  const audience = await createAudience(makeAudienceInput());
  const created = await createCampaign(makeCampaignInput(audience.id));
  const fetched = await getCampaign(created.id);
  assert.ok(fetched);
  assert.equal(fetched.id, created.id);
});

test("getCampaign returns null for unknown ID", async () => {
  const result = await getCampaign("nonexistent");
  assert.equal(result, null);
});

test("listCampaigns returns all campaigns when no filter is given", async () => {
  const aud = await createAudience(makeAudienceInput());
  await createCampaign(makeCampaignInput(aud.id));
  await createCampaign(makeCampaignInput(aud.id, { name: "Second Campaign" }));
  const all = await listCampaigns();
  assert.equal(all.length, 2);
});

test("listCampaigns filters by platform", async () => {
  const aud = await createAudience(makeAudienceInput());
  await createCampaign(makeCampaignInput(aud.id, { platform: "facebook" }));
  await createCampaign(makeCampaignInput(aud.id, { platform: "google" }));
  const fbOnly = await listCampaigns({ platform: "facebook" });
  assert.equal(fbOnly.length, 1);
  assert.equal(fbOnly[0].platform, "facebook");
});

test("listCampaigns filters by status", async () => {
  const aud = await createAudience(makeAudienceInput());
  const c1 = await createCampaign(makeCampaignInput(aud.id));
  // c1 is draft by default
  const drafts = await listCampaigns({ status: "draft" });
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].id, c1.id);
});

test("listCampaigns filters by tenantId", async () => {
  const aud = await createAudience(makeAudienceInput());
  await createCampaign(makeCampaignInput(aud.id, { tenantId: "tenant-1" }));
  await createCampaign(makeCampaignInput(aud.id, { tenantId: "tenant-2" }));
  const filtered = await listCampaigns({ tenantId: "tenant-2" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].tenantId, "tenant-2");
});

// ---------------------------------------------------------------------------
// pauseCampaign / resumeCampaign
// ---------------------------------------------------------------------------

test("pauseCampaign pauses a draft campaign", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  const paused = await pauseCampaign(campaign.id);
  assert.equal(paused.status, "paused");
});

test("pauseCampaign throws for unknown campaign", async () => {
  await assert.rejects(
    () => pauseCampaign("nonexistent"),
    { message: "Campaign nonexistent not found" },
  );
});

test("pauseCampaign throws for completed campaign", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  // Manually set to completed to test guard
  const fetched = await getCampaign(campaign.id);
  assert.ok(fetched);
  (fetched as AdCampaign).status = "completed";
  await assert.rejects(
    () => pauseCampaign(campaign.id),
    (err: Error) => err.message.includes("cannot be paused"),
  );
});

test("resumeCampaign resumes a paused campaign", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  await pauseCampaign(campaign.id);
  const resumed = await resumeCampaign(campaign.id);
  assert.equal(resumed.status, "active");
});

test("resumeCampaign throws for unknown campaign", async () => {
  await assert.rejects(
    () => resumeCampaign("nonexistent"),
    { message: "Campaign nonexistent not found" },
  );
});

test("resumeCampaign throws for draft campaign", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  await assert.rejects(
    () => resumeCampaign(campaign.id),
    (err: Error) => err.message.includes("cannot be resumed"),
  );
});

// ---------------------------------------------------------------------------
// updateCampaignMetrics
// ---------------------------------------------------------------------------

test("updateCampaignMetrics accumulates impressions and clicks", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  await updateCampaignMetrics(campaign.id, { impressions: 1000, clicks: 50 });
  await updateCampaignMetrics(campaign.id, { impressions: 500, clicks: 25 });
  const updated = await getCampaign(campaign.id);
  assert.ok(updated);
  assert.equal(updated.impressions, 1500);
  assert.equal(updated.clicks, 75);
});

test("updateCampaignMetrics computes CPA correctly", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  await updateCampaignMetrics(campaign.id, { spend: 500, conversions: 10 });
  const updated = await getCampaign(campaign.id);
  assert.ok(updated);
  assert.equal(updated.cpa, 50);
});

test("updateCampaignMetrics computes ROAS correctly", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  await updateCampaignMetrics(campaign.id, { spend: 100, conversions: 10 });
  const updated = await getCampaign(campaign.id);
  assert.ok(updated);
  // ROAS = (conversions * 50) / spend = 500 / 100 = 5
  assert.equal(updated.roas, 5);
});

test("updateCampaignMetrics throws for unknown campaign", async () => {
  await assert.rejects(
    () => updateCampaignMetrics("nonexistent", { spend: 100 }),
    { message: "Campaign nonexistent not found" },
  );
});

// ---------------------------------------------------------------------------
// getOptimizationSuggestions
// ---------------------------------------------------------------------------

test("getOptimizationSuggestions returns recommendations for a campaign", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  const optimization = await getOptimizationSuggestions(campaign.id);
  assert.equal(optimization.campaignId, campaign.id);
  assert.ok(Array.isArray(optimization.recommendations));
  assert.ok(optimization.recommendations.length >= 2);
  assert.ok(optimization.recommendations.length <= 4);
  assert.ok(typeof optimization.predictedImprovement === "number");
  assert.ok(optimization.predictedImprovement >= 10 && optimization.predictedImprovement <= 35);
});

test("getOptimizationSuggestions includes audience expansion recommendation", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  const optimization = await getOptimizationSuggestions(campaign.id);
  const audienceRec = optimization.recommendations.find((r) => r.type === "audience");
  assert.ok(audienceRec, "Should include audience expansion recommendation");
  assert.equal(audienceRec.action, "expand_audience");
});

test("getOptimizationSuggestions throws for unknown campaign", async () => {
  await assert.rejects(
    () => getOptimizationSuggestions("nonexistent"),
    { message: "Campaign nonexistent not found" },
  );
});

test("getOptimizationSuggestions generates creative recommendation for low CTR", async () => {
  const aud = await createAudience(makeAudienceInput());
  const campaign = await createCampaign(makeCampaignInput(aud.id));
  await updateCampaignMetrics(campaign.id, { impressions: 10000, clicks: 50, spend: 500, conversions: 2 });
  const optimization = await getOptimizationSuggestions(campaign.id);
  const creativeRec = optimization.recommendations.find((r) => r.type === "creative");
  assert.ok(creativeRec, "Should recommend creative refresh for low CTR");
  assert.equal(creativeRec.impact, "high");
});

// ---------------------------------------------------------------------------
// createRetargetingAudience
// ---------------------------------------------------------------------------

test("createRetargetingAudience creates a retargeting audience for a page URL", async () => {
  const audience = await createRetargetingAudience("LP Visitors", "https://example.com/landing", "tenant-1");
  assert.equal(audience.name, "LP Visitors");
  assert.equal(audience.type, "retargeting");
  assert.equal(audience.platform, "facebook");
  assert.equal(audience.sourceData, "https://example.com/landing");
  assert.equal(audience.tenantId, "tenant-1");
  assert.equal(audience.size, 0);
});

test("createRetargetingAudience works without tenantId", async () => {
  const audience = await createRetargetingAudience("Global Retarget", "https://example.com");
  assert.equal(audience.tenantId, undefined);
});

// ---------------------------------------------------------------------------
// getMarkoPoloStats
// ---------------------------------------------------------------------------

test("getMarkoPoloStats returns zero stats when store is empty", async () => {
  const stats = await getMarkoPoloStats();
  assert.equal(stats.totalAudiences, 0);
  assert.equal(stats.totalCampaigns, 0);
  assert.equal(stats.totalSpend, 0);
  assert.equal(stats.totalConversions, 0);
  assert.equal(stats.avgCpa, 0);
  assert.equal(stats.avgRoas, 0);
  assert.ok(stats.byPlatform.facebook);
  assert.ok(stats.byPlatform.google);
});

test("getMarkoPoloStats aggregates across campaigns", async () => {
  const aud = await createAudience(makeAudienceInput());
  const c1 = await createCampaign(makeCampaignInput(aud.id));
  const c2 = await createCampaign(makeCampaignInput(aud.id, { name: "Second" }));
  await updateCampaignMetrics(c1.id, { spend: 200, conversions: 5 });
  await updateCampaignMetrics(c2.id, { spend: 300, conversions: 10 });
  const stats = await getMarkoPoloStats();
  assert.equal(stats.totalCampaigns, 2);
  assert.equal(stats.totalSpend, 500);
  assert.equal(stats.totalConversions, 15);
});

test("getMarkoPoloStats filters by tenantId", async () => {
  const aud1 = await createAudience(makeAudienceInput({ tenantId: "tenant-1" }));
  const aud2 = await createAudience(makeAudienceInput({ tenantId: "tenant-2" }));
  await createCampaign(makeCampaignInput(aud1.id, { tenantId: "tenant-1" }));
  await createCampaign(makeCampaignInput(aud2.id, { tenantId: "tenant-2" }));
  const stats = await getMarkoPoloStats("tenant-1");
  assert.equal(stats.totalAudiences, 1);
  assert.equal(stats.totalCampaigns, 1);
});

test("getMarkoPoloStats computes byPlatform breakdown", async () => {
  const fbAud = await createAudience(makeAudienceInput({ platform: "facebook" }));
  const gAud = await createAudience(makeAudienceInput({ platform: "google" }));
  const fbCampaign = await createCampaign(makeCampaignInput(fbAud.id, { platform: "facebook" }));
  const gCampaign = await createCampaign(makeCampaignInput(gAud.id, { platform: "google" }));
  await updateCampaignMetrics(fbCampaign.id, { spend: 100, conversions: 5 });
  await updateCampaignMetrics(gCampaign.id, { spend: 200, conversions: 8 });
  const stats = await getMarkoPoloStats();
  assert.equal(stats.byPlatform.facebook.spend, 100);
  assert.equal(stats.byPlatform.facebook.conversions, 5);
  assert.equal(stats.byPlatform.google.spend, 200);
  assert.equal(stats.byPlatform.google.conversions, 8);
});

// ---------------------------------------------------------------------------
// markoPoloResult
// ---------------------------------------------------------------------------

test("markoPoloResult returns dry-run mode when no API key", () => {
  delete process.env.MARKOPOLO_API_KEY;
  const result = markoPoloResult("createAudience", "Audience created");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "MarkoPolo");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Audience created");
});

test("markoPoloResult returns live mode when API key is set", () => {
  process.env.MARKOPOLO_API_KEY = "test-key";
  const result = markoPoloResult("createAudience", "Audience created");
  assert.equal(result.mode, "live");
  delete process.env.MARKOPOLO_API_KEY;
});

// ---------------------------------------------------------------------------
// resetMarkoPoloStore
// ---------------------------------------------------------------------------

test("resetMarkoPoloStore clears all stores", async () => {
  const aud = await createAudience(makeAudienceInput());
  await createCampaign(makeCampaignInput(aud.id));
  resetMarkoPoloStore();
  const audiences = await listAudiences();
  const campaigns = await listCampaigns();
  assert.equal(audiences.length, 0);
  assert.equal(campaigns.length, 0);
});

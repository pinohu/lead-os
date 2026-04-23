import test from "node:test";
import assert from "node:assert/strict";
import {
  generateContentAngles,
  generateHook,
  generateScript,
  generateContentBatch,
  classifyContent,
  splitViralAndConversion,
  getGeneratedAssets,
  resetAssetStore,
  type Platform,
  type ContentAngle,
  type ContentBatch,
} from "../src/lib/social-asset-engine.ts";

test.beforeEach(() => {
  resetAssetStore();
});

// ---------------------------------------------------------------------------
// generateContentAngles
// ---------------------------------------------------------------------------

test("generateContentAngles returns at least 5 angles by default", () => {
  const angles = generateContentAngles("pest control services", "pest-control");
  assert.ok(angles.length >= 5);
});

test("generateContentAngles respects count parameter when greater than 5", () => {
  const angles = generateContentAngles("immigration law", "immigration-law", 8);
  assert.ok(angles.length >= 8);
});

test("generateContentAngles enforces minimum of 5 even when count is lower", () => {
  const angles = generateContentAngles("roofing services", "roofing", 2);
  assert.ok(angles.length >= 5);
});

test("generateContentAngles returns angles with required fields", () => {
  const angles = generateContentAngles("dental care", "dental");
  for (const angle of angles) {
    assert.ok(typeof angle.id === "string" && angle.id.length > 0, "id must be a non-empty string");
    assert.ok(angle.type === "viral" || angle.type === "conversion", "type must be viral or conversion");
    assert.ok(typeof angle.hook === "string" && angle.hook.length > 0, "hook must be non-empty");
    assert.ok(typeof angle.premise === "string" && angle.premise.length > 0, "premise must be non-empty");
    assert.ok(typeof angle.targetEmotion === "string" && angle.targetEmotion.length > 0, "targetEmotion must be non-empty");
    assert.ok(["low", "medium", "high"].includes(angle.estimatedReach), "estimatedReach must be low, medium, or high");
  }
});

test("generateContentAngles interpolates topic into hook text", () => {
  const angles = generateContentAngles("roof replacement", "roofing");
  const hooksWithTopic = angles.filter((a) => a.hook.toLowerCase().includes("roof replacement"));
  assert.ok(hooksWithTopic.length > 0, "At least one hook should contain the topic");
});

test("generateContentAngles generates both viral and conversion types", () => {
  const angles = generateContentAngles("insurance quotes", "insurance", 10);
  const viral = angles.filter((a) => a.type === "viral");
  const conversion = angles.filter((a) => a.type === "conversion");
  assert.ok(viral.length > 0, "Should have at least one viral angle");
  assert.ok(conversion.length > 0, "Should have at least one conversion angle");
});

test("generateContentAngles produces unique IDs for each angle", () => {
  const angles = generateContentAngles("staffing solutions", "staffing", 10);
  const ids = new Set(angles.map((a) => a.id));
  assert.equal(ids.size, angles.length);
});

test("generateContentAngles uses niche-specific pain points for pest-control", () => {
  // Generate enough angles to hit the template that injects {painPoint} (index 6)
  const angles = generateContentAngles("exterminator services", "pest-control", 10);
  const allText = angles.map((a) => a.hook + " " + a.premise).join(" ").toLowerCase();
  // The {painPoint} template resolves to the first pain point: "roaches in kitchen despite spraying"
  const hasPestRelated =
    allText.includes("roach") ||
    allText.includes("mice") ||
    allText.includes("termite") ||
    allText.includes("pest") ||
    allText.includes("kitchen") ||
    allText.includes("spraying");
  assert.ok(hasPestRelated, "Should include pest-control niche pain points");
});

test("generateContentAngles uses niche-specific pain points for immigration-law", () => {
  const angles = generateContentAngles("visa application help", "immigration-law");
  const allText = angles.map((a) => a.hook + a.premise).join(" ").toLowerCase();
  const hasImmigrationRelated = allText.includes("visa") || allText.includes("green card") || allText.includes("permanent residency");
  assert.ok(hasImmigrationRelated, "Should include immigration-law niche content");
});

test("generateContentAngles falls back gracefully for unknown niche", () => {
  const angles = generateContentAngles("some service", "unknown-niche-xyz");
  assert.ok(angles.length >= 5, "Should still generate angles for unknown niches");
});

// ---------------------------------------------------------------------------
// generateHook
// ---------------------------------------------------------------------------

test("generateHook returns required fields for tiktok", () => {
  const angles = generateContentAngles("pest control", "pest-control");
  const hook = generateHook(angles[0], "tiktok");
  assert.ok(typeof hook.text === "string" && hook.text.length > 0);
  assert.ok(["question", "shock", "story", "statistic", "contrarian"].includes(hook.style));
  assert.ok(hook.estimatedCTR >= 0 && hook.estimatedCTR <= 1);
});

test("generateHook assigns shock style for tiktok", () => {
  const angles = generateContentAngles("roofing", "roofing");
  const hook = generateHook(angles[0], "tiktok");
  assert.equal(hook.style, "shock");
});

test("generateHook assigns contrarian style for linkedin", () => {
  const angles = generateContentAngles("staffing", "staffing");
  const hook = generateHook(angles[0], "linkedin");
  assert.equal(hook.style, "contrarian");
});

test("generateHook assigns contrarian style for x", () => {
  const angles = generateContentAngles("insurance", "insurance");
  const hook = generateHook(angles[0], "x");
  assert.equal(hook.style, "contrarian");
});

test("generateHook adds punctuation to linkedin hooks", () => {
  const angles = generateContentAngles("dental services", "dental");
  const hook = generateHook(angles[0], "linkedin");
  const lastChar = hook.text[hook.text.length - 1];
  assert.ok(lastChar === "." || lastChar === "?", "LinkedIn hook should end with . or ?");
});

test("generateHook truncates x hook to 280 characters", () => {
  const longHookAngle: ContentAngle = {
    id: "test-1",
    type: "viral",
    hook: "A".repeat(300),
    premise: "test premise",
    targetEmotion: "curiosity",
    estimatedReach: "high",
  };
  const hook = generateHook(longHookAngle, "x");
  assert.ok(hook.text.length <= 280);
});

test("generateHook estimatedCTR is higher for high reach angles", () => {
  const highReachAngle: ContentAngle = {
    id: "angle-high",
    type: "viral",
    hook: "Test hook",
    premise: "Test premise",
    targetEmotion: "curiosity",
    estimatedReach: "high",
  };
  const lowReachAngle: ContentAngle = {
    id: "angle-low",
    type: "viral",
    hook: "Test hook",
    premise: "Test premise",
    targetEmotion: "curiosity",
    estimatedReach: "low",
  };
  const highHook = generateHook(highReachAngle, "tiktok");
  const lowHook = generateHook(lowReachAngle, "tiktok");
  assert.ok(highHook.estimatedCTR > lowHook.estimatedCTR);
});

// ---------------------------------------------------------------------------
// generateScript
// ---------------------------------------------------------------------------

test("generateScript returns required fields", () => {
  const angles = generateContentAngles("pest control", "pest-control");
  const script = generateScript(angles[0], "tiktok");
  assert.ok(Array.isArray(script.scenes) && script.scenes.length > 0);
  assert.ok(typeof script.totalDuration === "number");
  assert.ok(typeof script.cta === "string" && script.cta.length > 0);
  assert.ok(Array.isArray(script.hashtags));
});

test("generateScript defaults to 30s for tiktok", () => {
  const angles = generateContentAngles("test", "roofing");
  const script = generateScript(angles[0], "tiktok");
  assert.equal(script.totalDuration, 30);
});

test("generateScript defaults to 30s for instagram-reels", () => {
  const angles = generateContentAngles("test", "dental");
  const script = generateScript(angles[0], "instagram-reels");
  assert.equal(script.totalDuration, 30);
});

test("generateScript defaults to 60s for youtube-shorts", () => {
  const angles = generateContentAngles("test", "insurance");
  const script = generateScript(angles[0], "youtube-shorts");
  assert.equal(script.totalDuration, 60);
});

test("generateScript defaults to 120s for youtube-long", () => {
  const angles = generateContentAngles("test", "staffing");
  const script = generateScript(angles[0], "youtube-long");
  assert.equal(script.totalDuration, 120);
});

test("generateScript returns 0 duration for text platforms", () => {
  const angles = generateContentAngles("test", "real-estate");
  const linkedinScript = generateScript(angles[0], "linkedin");
  const xScript = generateScript(angles[0], "x");
  assert.equal(linkedinScript.totalDuration, 0);
  assert.equal(xScript.totalDuration, 0);
});

test("generateScript respects custom duration override", () => {
  const angles = generateContentAngles("test", "home-services");
  const script = generateScript(angles[0], "tiktok", 45);
  assert.equal(script.totalDuration, 45);
});

test("generateScript scenes sum to approximately totalDuration", () => {
  const angles = generateContentAngles("test", "pest-control");
  const script = generateScript(angles[0], "tiktok");
  const sceneSum = script.scenes.reduce((acc, s) => acc + s.duration, 0);
  assert.equal(sceneSum, script.totalDuration);
});

test("generateScript text-only platforms return single scene", () => {
  const angles = generateContentAngles("test", "roofing");
  const script = generateScript(angles[0], "linkedin");
  assert.equal(script.scenes.length, 1);
  assert.equal(script.scenes[0].visualType, "text-overlay");
});

// ---------------------------------------------------------------------------
// generateContentBatch
// ---------------------------------------------------------------------------

test("generateContentBatch returns a batch with correct structure", () => {
  const batch = generateContentBatch("pest services", "pest-control", ["tiktok", "linkedin"]);
  assert.ok(typeof batch.id === "string");
  assert.ok(typeof batch.topic === "string");
  assert.ok(typeof batch.niche === "string");
  assert.ok(typeof batch.generatedAt === "string");
  assert.ok(Array.isArray(batch.angles));
  assert.ok(Array.isArray(batch.assets));
});

test("generateContentBatch generates one asset per platform", () => {
  const platforms: Platform[] = ["tiktok", "instagram-reels", "linkedin"];
  const batch = generateContentBatch("roofing repair", "roofing", platforms);
  assert.equal(batch.assets.length, platforms.length);
  const returnedPlatforms = batch.assets.map((a) => a.platform);
  for (const p of platforms) {
    assert.ok(returnedPlatforms.includes(p), `Platform ${p} should be in assets`);
  }
});

test("generateContentBatch stores assets in memory", () => {
  const tenantId = "tenant-batch-test";
  generateContentBatch("dental care", "dental", ["tiktok"], tenantId);
  const stored = getGeneratedAssets(tenantId);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].topic, "dental care");
});

// ---------------------------------------------------------------------------
// classifyContent
// ---------------------------------------------------------------------------

test("classifyContent marks content with booking CTA as conversion", () => {
  const result = classifyContent({ cta: "Book your free consultation today" });
  assert.equal(result, "conversion");
});

test("classifyContent marks content with download CTA as conversion", () => {
  const result = classifyContent({ cta: "Download the free guide now" });
  assert.equal(result, "conversion");
});

test("classifyContent marks content without direct CTA as viral", () => {
  const result = classifyContent({ cta: "Follow for more content like this" });
  assert.equal(result, "viral");
});

test("classifyContent reads CTA from script when top-level cta is absent", () => {
  const result = classifyContent({
    script: {
      scenes: [],
      totalDuration: 30,
      cta: "Schedule your free consultation",
      hashtags: [],
    },
  });
  assert.equal(result, "conversion");
});

// ---------------------------------------------------------------------------
// splitViralAndConversion
// ---------------------------------------------------------------------------

test("splitViralAndConversion correctly separates viral and conversion assets", () => {
  const batch = generateContentBatch("insurance tips", "insurance", ["tiktok", "linkedin", "youtube-long", "x", "instagram-reels"]);
  const split = splitViralAndConversion(batch);
  assert.ok(Array.isArray(split.viral));
  assert.ok(Array.isArray(split.conversion));
  assert.equal(split.viral.length + split.conversion.length, batch.assets.length);
});

test("splitViralAndConversion never mixes viral and conversion in same array", () => {
  const batch = generateContentBatch("real estate tips", "real-estate", ["tiktok", "linkedin", "x", "facebook", "instagram-reels", "youtube-shorts", "youtube-long"]);
  const split = splitViralAndConversion(batch);
  for (const asset of split.viral) {
    assert.equal(asset.angle.type, "viral");
  }
  for (const asset of split.conversion) {
    assert.equal(asset.angle.type, "conversion");
  }
});

// ---------------------------------------------------------------------------
// Asset store
// ---------------------------------------------------------------------------

test("getGeneratedAssets returns empty array for unknown tenant", () => {
  const assets = getGeneratedAssets("nonexistent-tenant");
  assert.deepEqual(assets, []);
});

test("resetAssetStore clears all stored assets", () => {
  generateContentBatch("test topic", "staffing", ["tiktok"], "tenant-reset-test");
  resetAssetStore();
  const assets = getGeneratedAssets("tenant-reset-test");
  assert.deepEqual(assets, []);
});

test("getGeneratedAssets accumulates multiple batches for same tenant", () => {
  const tenantId = "tenant-multi";
  generateContentBatch("topic A", "dental", ["tiktok"], tenantId);
  generateContentBatch("topic B", "roofing", ["linkedin"], tenantId);
  const assets = getGeneratedAssets(tenantId);
  assert.equal(assets.length, 2);
});

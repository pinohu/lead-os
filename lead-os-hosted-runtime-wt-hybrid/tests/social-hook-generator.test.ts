import test from "node:test";
import assert from "node:assert/strict";
import {
  generateHooks,
  getHooksByPlatform,
  rankHooksByEngagement,
  storeHooks,
  getStoredHooks,
  _resetStores,
  type HookPlatform,
} from "../src/lib/social-hook-generator.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// generateHooks
// ---------------------------------------------------------------------------

test("generateHooks returns hooks for each requested platform", () => {
  const hooks = generateHooks({ topic: "lead gen", niche: "real-estate", platforms: ["tiktok", "linkedin"] });
  const platforms = new Set(hooks.map((h) => h.platform));
  assert.ok(platforms.has("tiktok"), "Should include tiktok hooks");
  assert.ok(platforms.has("linkedin"), "Should include linkedin hooks");
});

test("generateHooks respects count parameter per platform", () => {
  const hooks = generateHooks({ topic: "pest control", niche: "pest-control", platforms: ["x"], count: 5 });
  const xHooks = hooks.filter((h) => h.platform === "x");
  assert.equal(xHooks.length, 5);
});

test("generateHooks defaults to 3 hooks per platform", () => {
  const hooks = generateHooks({ topic: "dental care", niche: "dental", platforms: ["instagram"] });
  const igHooks = hooks.filter((h) => h.platform === "instagram");
  assert.equal(igHooks.length, 3);
});

test("generateHooks includes all required fields", () => {
  const hooks = generateHooks({ topic: "roofing", niche: "roofing", platforms: ["youtube"] });
  for (const hook of hooks) {
    assert.ok(hook.id.length > 0);
    assert.ok(hook.text.length > 0);
    assert.ok(hook.type.length > 0);
    assert.equal(hook.platform, "youtube");
    assert.equal(hook.characterCount, hook.text.length);
    assert.ok(hook.estimatedEngagement >= 0 && hook.estimatedEngagement <= 1);
    assert.ok(hook.generatedAt.length > 0);
  }
});

test("generateHooks filters by hookTypes", () => {
  const hooks = generateHooks({ topic: "marketing", niche: "dental", platforms: ["tiktok"], hookTypes: ["question", "story"], count: 5 });
  for (const hook of hooks) {
    assert.ok(hook.type === "question" || hook.type === "story", `Expected question or story, got ${hook.type}`);
  }
});

test("generateHooks respects platform character limits", () => {
  const hooks = generateHooks({ topic: "immigration", niche: "immigration-law", platforms: ["x"], count: 10 });
  for (const hook of hooks) {
    assert.ok(hook.characterCount <= 280, `X hook should be <= 280 chars, got ${hook.characterCount}`);
  }
});

test("generateHooks interpolates topic into hook text", () => {
  const hooks = generateHooks({ topic: "roof repair", niche: "roofing", platforms: ["linkedin"], count: 5 });
  const withTopic = hooks.filter((h) => h.text.toLowerCase().includes("roof repair"));
  assert.ok(withTopic.length > 0, "At least one hook should contain the topic");
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

test("getHooksByPlatform groups hooks correctly", () => {
  const hooks = generateHooks({ topic: "test", niche: "dental", platforms: ["tiktok", "linkedin", "x"] });
  const grouped = getHooksByPlatform(hooks);
  assert.ok(grouped.tiktok.length > 0);
  assert.ok(grouped.linkedin.length > 0);
  assert.ok(grouped.x.length > 0);
});

test("rankHooksByEngagement sorts descending", () => {
  const hooks = generateHooks({ topic: "test", niche: "dental", platforms: ["tiktok"], count: 5 });
  const ranked = rankHooksByEngagement(hooks);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].estimatedEngagement >= ranked[i].estimatedEngagement);
  }
});

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

test("storeHooks and getStoredHooks round-trip correctly", () => {
  const hooks = generateHooks({ topic: "test", niche: "dental", platforms: ["tiktok"] });
  const tenantId = `hook-store-${Date.now()}`;
  storeHooks(tenantId, hooks);
  const stored = getStoredHooks(tenantId);
  assert.equal(stored.length, hooks.length);
});

test("getStoredHooks returns empty for unknown tenant", () => {
  const result = getStoredHooks(`unknown-${Date.now()}`);
  assert.equal(result.length, 0);
});

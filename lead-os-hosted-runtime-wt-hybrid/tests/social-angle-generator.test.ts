import test from "node:test";
import assert from "node:assert/strict";
import {
  generateAngles,
  storeAngles,
  getStoredAngles,
  getAngleById,
  _resetStores,
  type ContentAngle,
} from "../src/lib/social-angle-generator.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// generateAngles
// ---------------------------------------------------------------------------

test("generateAngles returns at least 10 angles by default", () => {
  const angles = generateAngles({ topic: "lead generation", niche: "real-estate" });
  assert.ok(angles.length >= 10, `Expected at least 10, got ${angles.length}`);
});

test("generateAngles respects higher count parameter", () => {
  const angles = generateAngles({ topic: "pest treatment", niche: "pest-control", count: 15 });
  assert.ok(angles.length >= 15, `Expected at least 15, got ${angles.length}`);
});

test("generateAngles enforces minimum of 10 even when count is lower", () => {
  const angles = generateAngles({ topic: "marketing", niche: "dental", count: 3 });
  assert.ok(angles.length >= 10, `Expected at least 10, got ${angles.length}`);
});

test("generateAngles returns angles with all required fields", () => {
  const angles = generateAngles({ topic: "visa applications", niche: "immigration-law" });
  for (const angle of angles) {
    assert.ok(angle.id.length > 0, "id must be non-empty");
    assert.ok(angle.hook.length > 0, "hook must be non-empty");
    assert.ok(Array.isArray(angle.bodyOutline) && angle.bodyOutline.length > 0, "bodyOutline must be non-empty array");
    assert.ok(angle.cta.length > 0, "cta must be non-empty");
    assert.ok(angle.targetEmotion.length > 0, "targetEmotion must be non-empty");
    assert.ok(angle.controversyScore >= 0 && angle.controversyScore <= 1, "controversyScore must be 0-1");
    assert.ok(angle.shareabilityScore >= 0 && angle.shareabilityScore <= 1, "shareabilityScore must be 0-1");
    assert.equal(angle.topic, "visa applications");
    assert.equal(angle.niche, "immigration-law");
    assert.ok(angle.generatedAt.length > 0, "generatedAt must be set");
  }
});

test("generateAngles interpolates topic into hooks", () => {
  const angles = generateAngles({ topic: "roof repair", niche: "roofing" });
  const withTopic = angles.filter((a) => a.hook.toLowerCase().includes("roof repair"));
  assert.ok(withTopic.length > 0, "At least one hook should contain the topic");
});

test("generateAngles filters by controversy range", () => {
  const angles = generateAngles({ topic: "marketing", niche: "dental", minControversy: 0.7, maxControversy: 1.0 });
  for (const angle of angles) {
    assert.ok(angle.controversyScore >= 0.6, `Controversy ${angle.controversyScore} should be near or above 0.7`);
  }
});

test("generateAngles uses fallback profile for unknown niche", () => {
  const angles = generateAngles({ topic: "growth hacking", niche: "unknown-niche-xyz" });
  assert.ok(angles.length >= 10, "Should still generate angles for unknown niche");
});

test("generateAngles produces unique IDs", () => {
  const angles = generateAngles({ topic: "marketing", niche: "dental" });
  const ids = new Set(angles.map((a) => a.id));
  assert.equal(ids.size, angles.length, "All IDs should be unique");
});

// ---------------------------------------------------------------------------
// Store operations
// ---------------------------------------------------------------------------

test("storeAngles and getStoredAngles work correctly", () => {
  const angles = generateAngles({ topic: "test", niche: "dental" });
  const tenantId = `angle-test-${Date.now()}`;
  storeAngles(tenantId, angles);
  const stored = getStoredAngles(tenantId);
  assert.equal(stored.length, angles.length);
});

test("getAngleById finds a specific angle", () => {
  const angles = generateAngles({ topic: "test", niche: "dental" });
  const tenantId = `angle-find-${Date.now()}`;
  storeAngles(tenantId, angles);
  const found = getAngleById(tenantId, angles[0].id);
  assert.ok(found);
  assert.equal(found.id, angles[0].id);
});

test("getAngleById returns undefined for non-existent angle", () => {
  const tenantId = `angle-none-${Date.now()}`;
  const found = getAngleById(tenantId, "non-existent-id");
  assert.equal(found, undefined);
});

test("getStoredAngles returns empty array for unknown tenant", () => {
  const result = getStoredAngles(`unknown-${Date.now()}`);
  assert.equal(result.length, 0);
});

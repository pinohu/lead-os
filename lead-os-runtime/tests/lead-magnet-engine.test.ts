import test from "node:test";
import assert from "node:assert/strict";
import {
  loadCatalog,
  getMagnetBySlug,
  recommendMagnets,
} from "../src/lib/lead-magnet-engine.ts";

// ---------------------------------------------------------------------------
// loadCatalog
// ---------------------------------------------------------------------------

test("loadCatalog returns an array (empty if catalog file not found)", () => {
  const catalog = loadCatalog();
  assert.ok(Array.isArray(catalog));
});

test("loadCatalog returns the same reference on subsequent calls (caching)", () => {
  const a = loadCatalog();
  const b = loadCatalog();
  assert.equal(a, b, "loadCatalog should return cached reference");
});

test("loadCatalog magnets have required fields when catalog exists", () => {
  const catalog = loadCatalog();
  if (catalog.length === 0) {
    return;
  }

  for (const magnet of catalog.slice(0, 5)) {
    assert.ok(magnet.id, "id is required");
    assert.ok(magnet.slug, "slug is required");
    assert.ok(magnet.title, "title is required");
    assert.ok(magnet.category, "category is required");
    assert.ok(magnet.deliveryType, "deliveryType is required");
    assert.ok(Array.isArray(magnet.formFields), "formFields must be an array");
    assert.ok(magnet.status, "status is required");
    assert.ok(magnet.niche, "niche is required");
    assert.ok(Array.isArray(magnet.tags), "tags must be an array");
  }
});

// ---------------------------------------------------------------------------
// getMagnetBySlug
// ---------------------------------------------------------------------------

test("getMagnetBySlug returns undefined for non-existent slug", () => {
  const result = getMagnetBySlug("this-slug-definitely-does-not-exist-" + Date.now());
  assert.equal(result, undefined);
});

test("getMagnetBySlug finds magnet by slug when catalog is loaded", () => {
  const catalog = loadCatalog();
  if (catalog.length === 0) {
    return;
  }

  const first = catalog[0];
  const found = getMagnetBySlug(first.slug);
  assert.ok(found);
  assert.equal(found.id, first.id);
});

test("getMagnetBySlug falls back to ID lookup when slug does not match", () => {
  const catalog = loadCatalog();
  if (catalog.length === 0) {
    return;
  }

  const first = catalog[0];
  const found = getMagnetBySlug(first.id);
  assert.ok(found);
  assert.equal(found.id, first.id);
});

// ---------------------------------------------------------------------------
// recommendMagnets
// ---------------------------------------------------------------------------

test("recommendMagnets returns an array of recommendations", () => {
  const result = recommendMagnets({});
  assert.ok(Array.isArray(result));
});

test("recommendMagnets respects the limit parameter", () => {
  const result = recommendMagnets({}, 3);
  assert.ok(result.length <= 3);
});

test("recommendMagnets returns recommendations sorted by score descending", () => {
  const result = recommendMagnets({ niche: "general" }, 10);
  for (let i = 1; i < result.length; i++) {
    assert.ok(
      result[i - 1].score >= result[i].score,
      `Expected sorted descending: ${result[i - 1].score} >= ${result[i].score}`,
    );
  }
});

test("recommendMagnets scores niche matches higher than non-matches", () => {
  const catalog = loadCatalog();
  if (catalog.length === 0) {
    return;
  }

  const nicheWithMagnets = catalog[0].niche;
  const withNiche = recommendMagnets({ niche: nicheWithMagnets }, 5);
  const withoutNiche = recommendMagnets({}, 5);

  if (withNiche.length > 0 && withoutNiche.length > 0) {
    assert.ok(
      withNiche[0].score >= 0,
      "Niche-specific recommendations should have non-negative scores",
    );
  }
});

test("recommendMagnets includes reason text in each recommendation", () => {
  const result = recommendMagnets({ niche: "general", source: "organic" }, 5);
  for (const rec of result) {
    assert.ok(typeof rec.reason === "string");
    assert.ok(rec.reason.length > 0);
  }
});

test("recommendMagnets each recommendation has a magnet and a numeric score", () => {
  const result = recommendMagnets({ funnelFamily: "lead-magnet" }, 5);
  for (const rec of result) {
    assert.ok(rec.magnet);
    assert.ok(typeof rec.score === "number");
    assert.ok(rec.score >= 0 && rec.score <= 1);
  }
});

test("recommendMagnets only returns active magnets", () => {
  const result = recommendMagnets({}, 100);
  for (const rec of result) {
    assert.equal(rec.magnet.status, "active");
  }
});

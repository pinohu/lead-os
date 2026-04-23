// tests/gtm-config.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GTM_USE_CASES, getGtmUseCaseById, getGtmUseCaseBySlug, resolveGtmCanonicalSlug } from "../src/config/gtm-use-cases.ts";
import { validateGtmUseCasesConfig } from "../src/lib/gtm/config-validation.ts";
import { executionSurfacesForAnchor } from "../src/lib/gtm/execution-links.ts";
import { mergeGtmUseCasesWithStatus } from "../src/lib/gtm/merge.ts";

describe("GTM config", () => {
  it("passes structural validation", () => {
    const r = validateGtmUseCasesConfig(GTM_USE_CASES);
    assert.equal(r.ok, true);
  });

  it("resolves Erie alias to canonical slug", () => {
    assert.equal(resolveGtmCanonicalSlug("erie-plumbing"), "erie-exclusive-niche");
    assert.equal(getGtmUseCaseBySlug("erie-plumbing")?.id, 1);
  });

  it("merges defaults when no rows", () => {
    const merged = mergeGtmUseCasesWithStatus(GTM_USE_CASES, []);
    assert.equal(merged.length, GTM_USE_CASES.length);
    assert.equal(merged[0]?.status, "not_started");
    assert.ok(merged[0]?.executionSurfaces.length > 0);
  });

  it("getGtmUseCaseById returns first play", () => {
    const u = getGtmUseCaseById(1);
    assert.equal(u?.slug, "erie-exclusive-niche");
  });
});

describe("GTM execution link derivation", () => {
  it("maps POST /api/intake to /api/intake", () => {
    const links = executionSurfacesForAnchor("POST /api/intake");
    assert.equal(links[0]?.href, "/api/intake");
    assert.equal(links[0]?.kind, "api");
  });

  it("maps dashboard paths", () => {
    const links = executionSurfacesForAnchor("/dashboard/control-plane");
    assert.equal(links[0]?.href, "/dashboard/control-plane");
  });
});

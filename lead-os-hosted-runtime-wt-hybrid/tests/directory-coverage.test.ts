import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDirectoryCoveragePage,
  directoryMarkets,
  directoryRegions,
  directoryStates,
  erieDirectoryAudit,
  listDirectoryCoveragePages,
} from "../src/lib/directory-coverage.ts";

describe("directory coverage architecture", () => {
  it("exposes national, region, state, and major-city directory pages from one route template", () => {
    const pages = listDirectoryCoveragePages();
    const kinds = new Set(pages.map((page) => page.kind));

    assert.ok(pages.length >= 110);
    assert.ok(kinds.has("national"));
    assert.ok(kinds.has("national-niche"));
    assert.ok(kinds.has("region"));
    assert.ok(kinds.has("state"));
    assert.ok(kinds.has("city"));
    assert.equal(pages.every((page) => page.routePattern === "/directory/[vertical]"), true);
  });

  it("keeps Erie.pro complete as the first city directory entry", () => {
    const erie = buildDirectoryCoveragePage("city-erie-pa");

    assert.ok(erie);
    assert.equal(erie.kind, "city");
    assert.equal(erie.primaryMarket?.seedTenantId, "erie");
    assert.deepEqual(erie.primaryMarket?.seededCategories, ["plumbing", "hvac"]);
    assert.equal(erieDirectoryAudit.status, "complete");
    assert.equal(erieDirectoryAudit.publicPath, "/directory/city-erie-pa");
    assert.ok(erieDirectoryAudit.verifiedSurfaces.includes("city directory page"));
    assert.ok(erieDirectoryAudit.seededNodes.includes("plumber_erie_test_1"));
    assert.ok(erieDirectoryAudit.seededNodes.includes("hvac_erie_test_1"));
  });

  it("creates national niche directories without duplicating city pages per niche", () => {
    const nationalHomeServices = buildDirectoryCoveragePage("national-home-services");

    assert.ok(nationalHomeServices);
    assert.equal(nationalHomeServices.kind, "national-niche");
    assert.equal(nationalHomeServices.niche?.slug, "home-services");
    assert.ok(nationalHomeServices.markets.length === directoryMarkets.length);
    assert.ok(nationalHomeServices.operationalNotes.some((note) => note.includes("Do not duplicate city copy")));
  });

  it("uses regional hubs to group all niches together before city-by-niche expansion", () => {
    const greatLakes = buildDirectoryCoveragePage("region-great-lakes");

    assert.ok(greatLakes);
    assert.equal(greatLakes.kind, "region");
    assert.equal(greatLakes.niches.length >= 10, true);
    assert.ok(greatLakes.markets.some((market) => market.slug === "city-erie-pa"));
    assert.ok(directoryRegions.some((region) => region.slug === "great-lakes"));
  });

  it("covers states and major city access with explicit entries", () => {
    assert.ok(directoryStates.length >= 51);
    assert.ok(directoryMarkets.length >= 35);
    assert.ok(buildDirectoryCoveragePage("state-pa"));
    assert.ok(buildDirectoryCoveragePage("city-buffalo-ny"));
    assert.ok(buildDirectoryCoveragePage("city-houston-tx"));
    assert.ok(buildDirectoryCoveragePage("city-los-angeles-ca"));
  });
});

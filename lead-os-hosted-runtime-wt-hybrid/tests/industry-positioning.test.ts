import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nicheCatalog } from "../src/lib/catalog.ts";
import { getIndustryPositioning, industryPositioning } from "../src/lib/industry-positioning.ts";

describe("industry positioning", () => {
  it("has a positioning profile for every industry route", () => {
    for (const niche of Object.values(nicheCatalog)) {
      const positioning = getIndustryPositioning(niche.slug);

      assert.equal(positioning.slug, niche.slug);
      assert.ok(positioning.title.length > 20);
      assert.ok(positioning.primaryPain.length > 40);
      assert.ok(positioning.promisedResult.length > 50);
      assert.ok(positioning.outcomes.length >= 3);
      assert.ok(positioning.deliverables.length >= 4);
      assert.ok(positioning.journey.length >= 4);
    }
  });

  it("does not reuse the same headline or market truth across industry pages", () => {
    const profiles = Object.values(industryPositioning);
    const titles = new Set(profiles.map((profile) => profile.title));
    const marketTruths = new Set(profiles.map((profile) => profile.marketTruth));

    assert.equal(titles.size, profiles.length);
    assert.equal(marketTruths.size, profiles.length);
  });

  it("names concrete delivered forms instead of generic tool language", () => {
    for (const profile of Object.values(industryPositioning)) {
      const deliveredText = profile.outcomes.map((outcome) => outcome.deliveredAs).join(" ");

      assert.match(deliveredText, /intake|workflow|routing|dashboard|sequence|report|handoff|scoring|queue|rules/i);
      assert.doesNotMatch(profile.title, /custom ai solutions|automation services/i);
    }
  });
});

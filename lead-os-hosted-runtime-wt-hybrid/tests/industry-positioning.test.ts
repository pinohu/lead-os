import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nicheCatalog } from "../src/lib/catalog.ts";
import {
  getIndustryAudienceModel,
  getIndustryPositioning,
  industryAudienceModels,
  industryPositioning,
} from "../src/lib/industry-positioning.ts";

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

  it("defines a clear buyer, user, and downstream audience for every industry route", () => {
    for (const niche of Object.values(nicheCatalog)) {
      const audience = getIndustryAudienceModel(niche.slug);

      assert.equal(industryAudienceModels[niche.slug], audience);
      assert.match(audience.model, /^B2B(2C)?$/);
      assert.ok(audience.buyer.length > 40, `${niche.slug} buyer is too thin`);
      assert.ok(audience.internalUsers.length > 40, `${niche.slug} internal user is too thin`);
      assert.ok(audience.downstreamAudience.length > 40, `${niche.slug} downstream audience is too thin`);
      assert.ok(audience.buyerMessage.length > 60, `${niche.slug} buyer message is too thin`);
      assert.ok(audience.notFor.length > 30, `${niche.slug} boundary is too thin`);
    }
  });

  it("keeps industry pages buyer-first and free of placeholder proof", () => {
    const disallowed = /Used by X|No no|LeadOS shifts|custom AI solutions|automation services/i;

    for (const profile of Object.values(industryPositioning)) {
      const visibleCopy = [
        profile.eyebrow,
        profile.audience,
        profile.title,
        profile.summary,
        profile.marketTruth,
        profile.primaryPain,
        profile.promisedResult,
        profile.proofMetric,
        ...profile.painPoints,
        ...profile.deliverables,
        ...profile.outcomes.flatMap((outcome) => [outcome.label, outcome.result, outcome.deliveredAs]),
        ...profile.journey.flatMap((step) => [step.label, step.customerReality, step.systemResponse]),
      ].join("\n");

      assert.doesNotMatch(visibleCopy, disallowed, `${profile.slug} contains placeholder or tool-first copy`);
      assert.doesNotMatch(profile.summary, /^Lead OS /, `${profile.slug} summary should lead with outcome, not brand`);
    }
  });
});

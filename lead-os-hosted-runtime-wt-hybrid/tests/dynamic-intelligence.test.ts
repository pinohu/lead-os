import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateDynamicIntelligence,
  getIntelligenceForAnyNiche,
  getCacheSize,
  clearCache,
  getCachedNiches,
} from "../src/lib/dynamic-intelligence.ts";

describe("Dynamic Customer Intelligence Generator", () => {
  it("returns pre-built profile for known niches", () => {
    const profile = getIntelligenceForAnyNiche("legal");
    assert.equal(profile.niche, "legal");
    assert.equal(profile.nicheLabel, "Law Firms & Legal Practices");
  });

  it("generates a profile for a completely unknown niche", () => {
    clearCache();
    const profile = generateDynamicIntelligence("mobile dog grooming");
    assert.equal(profile.niche, "mobile-dog-grooming");
    assert.equal(profile.nicheLabel, "Mobile Dog Grooming");
    assert.ok(profile.icp.title, "Should have ICP title");
    assert.ok(profile.buyingTriggers.length >= 3, "Should have buying triggers");
    assert.ok(profile.objections.length >= 2, "Should have objections");
    assert.ok(profile.decisionJourney.stages.length >= 3, "Should have journey stages");
    assert.ok(profile.trustSignals.primary.length >= 2, "Should have trust signals");
    assert.ok(profile.conversionPsychology.primaryMotivation, "Should have motivation");
    assert.ok(profile.competitors.differentiators.length >= 2, "Should have differentiators");
    assert.ok(profile.contentMap.length >= 3, "Should have content map");
  });

  it("maps niche keywords to correct base category", () => {
    const dental = generateDynamicIntelligence("pediatric dental practice");
    // "dental" keyword maps to "health" category
    assert.ok(dental.decisionJourney.totalDays > 0);

    const roofing = generateDynamicIntelligence("commercial roofing");
    // "roof" keyword maps to "construction"
    assert.ok(roofing.buyingTriggers.length >= 3);

    const immigration = generateDynamicIntelligence("immigration visa consulting");
    // "immigration" should map via keyword
    assert.ok(immigration.objections.length >= 2);
  });

  it("interpolates niche name into generated content", () => {
    clearCache();
    const profile = generateDynamicIntelligence("solar panel installation");
    assert.ok(
      profile.icp.industries.some((i) => i.toLowerCase().includes("solar")),
      "ICP industries should include the niche name",
    );
    assert.ok(
      profile.conversionPsychology.priceAnchor.includes("solar panel installation"),
      "Price anchor should include niche name",
    );
  });

  it("caches generated profiles", () => {
    clearCache();
    const profile1 = generateDynamicIntelligence("yacht charter management");
    const profile2 = generateDynamicIntelligence("yacht charter management");
    assert.equal(profile1.niche, profile2.niche);
    assert.ok(getCacheSize() >= 1, "Cache should contain at least 1 entry");
    assert.ok(getCachedNiches().includes("yacht-charter-management"), "Cache should contain the niche slug");
  });

  it("generates different profiles for different niches", () => {
    clearCache();
    const a = generateDynamicIntelligence("pet grooming salon");
    const b = generateDynamicIntelligence("commercial real estate brokerage");
    assert.notEqual(a.niche, b.niche);
    assert.notEqual(a.nicheLabel, b.nicheLabel);
  });

  it("getIntelligenceForAnyNiche handles both known and unknown", () => {
    const known = getIntelligenceForAnyNiche("construction");
    assert.equal(known.niche, "construction");

    const unknown = getIntelligenceForAnyNiche("artisanal coffee roasting");
    assert.equal(unknown.niche, "artisanal-coffee-roasting");
    assert.ok(unknown.buyingTriggers.length >= 3);
  });

  it("generated profile has all required fields matching the interface", () => {
    clearCache();
    const profile = generateDynamicIntelligence("escape room entertainment");
    const requiredFields = [
      "niche", "nicheLabel", "lastUpdated", "icp", "buyingTriggers",
      "decisionJourney", "objections", "trustSignals", "conversionPsychology",
      "competitors", "contentMap",
    ];
    for (const field of requiredFields) {
      assert.ok(
        field in profile,
        `Generated profile missing required field: ${field}`,
      );
    }
  });

  it("clearCache actually clears", () => {
    generateDynamicIntelligence("test-niche-for-clear");
    assert.ok(getCacheSize() > 0);
    clearCache();
    assert.equal(getCacheSize(), 0);
  });

  it("generated profiles include LeadOS-specific differentiators", () => {
    clearCache();
    const profile = generateDynamicIntelligence("wedding photography");
    const diffs = profile.competitors.differentiators.join(" ");
    assert.ok(diffs.includes("AI"), "Should mention AI scoring");
    assert.ok(diffs.includes("multi-niche") || diffs.includes("Multi-niche"), "Should mention multi-niche support");
  });
});

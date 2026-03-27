import test from "node:test";
import assert from "node:assert/strict";
import {
  loadNicheConfig,
  createNicheConfig,
  updateNicheConfig,
  listNicheConfigs,
  deleteNicheConfig,
  resolveNicheConfig,
  applyNicheToScoring,
  applyNicheToOffers,
  applyNicheToPsychology,
  applyNicheToChannels,
  generateNicheConfigFromDesignSpec,
  exportNicheConfigAsDesignMd,
  resetNicheConfigStore,
  getBuiltInSlugs,
  type NicheConfig,
} from "../src/lib/niche-adapter.ts";

function setup() {
  resetNicheConfigStore();
}

function buildTestConfig(overrides: Partial<NicheConfig> = {}): NicheConfig {
  return {
    slug: "test-niche",
    name: "Test Niche",
    industry: "service",
    audience: {
      description: "Test audience",
      painPoints: ["Pain point 1"],
      urgencyType: "scheduled",
      avgDealValue: { min: 100, max: 1000 },
      decisionMakers: ["business owner"],
    },
    scoring: {
      intentWeight: 0.35,
      fitWeight: 0.15,
      engagementWeight: 0.25,
      urgencyWeight: 0.25,
      sourceWeights: { "google-ads": 30, referral: 25 },
      urgencyKeywords: ["urgent", "asap"],
      fitSignals: ["right-industry"],
    },
    offers: {
      primary: { name: "Test Offer", priceRange: { min: 500, max: 2000 }, guarantee: "30-day guarantee" },
      upsells: [{ name: "Premium Add-On", price: 500 }],
      leadMagnet: "Free Guide",
      pricingModel: "per-project",
    },
    psychology: {
      primaryFear: "Wasting money",
      primaryDesire: "Growing revenue",
      trustFactors: ["verified-reviews"],
      objectionPatterns: ["Too expensive"],
      urgencyTriggers: ["Limited time"],
    },
    channels: {
      primary: ["google-ads"],
      secondary: ["facebook"],
      followUp: { sms: true, email: true, call: false, whatsapp: false },
      responseTimeTarget: 15,
    },
    funnels: {
      preferredFamily: "qualification",
      conversionPath: ["landing-page", "assessment", "booking"],
      nurtureDuration: 30,
      touchFrequency: 3,
    },
    monetization: {
      model: "managed-service",
      leadValue: { min: 50, max: 200 },
      marginTarget: 40,
    },
    content: {
      headlines: { cold: "Cold headline", warm: "Warm headline", hot: "Hot headline", burning: "Burning headline" },
      ctas: ["Get Started"],
      emailSubjects: ["Subject 1"],
      smsTemplates: ["Hi {{name}}"],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Built-in configs
// ---------------------------------------------------------------------------

test("built-in configs are loaded on initialization", () => {
  setup();
  const slugs = getBuiltInSlugs();
  assert.ok(slugs.length >= 5);
  assert.ok(slugs.includes("pest-control"));
  assert.ok(slugs.includes("immigration-law"));
  assert.ok(slugs.includes("roofing"));
  assert.ok(slugs.includes("real-estate-syndication"));
  assert.ok(slugs.includes("staffing-agency"));
});

test("loadNicheConfig returns built-in pest-control config", () => {
  setup();
  const config = loadNicheConfig("pest-control");
  assert.ok(config);
  assert.equal(config.slug, "pest-control");
  assert.equal(config.industry, "service");
  assert.ok(config.audience.painPoints.length > 0);
  assert.ok(config.scoring.urgencyKeywords.length > 0);
});

test("loadNicheConfig returns built-in immigration-law config", () => {
  setup();
  const config = loadNicheConfig("immigration-law");
  assert.ok(config);
  assert.equal(config.slug, "immigration-law");
  assert.equal(config.industry, "legal");
  assert.ok(config.audience.decisionMakers.length > 0);
});

test("loadNicheConfig returns null for non-existent slug", () => {
  setup();
  const config = loadNicheConfig("non-existent");
  assert.equal(config, null);
});

// ---------------------------------------------------------------------------
// createNicheConfig
// ---------------------------------------------------------------------------

test("createNicheConfig stores a valid config", () => {
  setup();
  const config = buildTestConfig();
  const { config: created, errors } = createNicheConfig(config);

  assert.equal(errors.length, 0);
  assert.ok(created);
  assert.equal(created.slug, "test-niche");

  const loaded = loadNicheConfig("test-niche");
  assert.ok(loaded);
  assert.equal(loaded.name, "Test Niche");
});

test("createNicheConfig rejects duplicate slugs", () => {
  setup();
  const config = buildTestConfig();
  createNicheConfig(config);

  const { config: second, errors } = createNicheConfig(config);
  assert.equal(second, null);
  assert.ok(errors.some((e) => e.includes("already exists")));
});

test("createNicheConfig validates required fields", () => {
  setup();
  const invalid = buildTestConfig({
    slug: "",
    name: "",
    industry: "",
    audience: { description: "", painPoints: [], urgencyType: "scheduled", avgDealValue: { min: 0, max: 0 }, decisionMakers: [] },
  });

  const { config: created, errors } = createNicheConfig(invalid);
  assert.equal(created, null);
  assert.ok(errors.length > 0);
});

test("createNicheConfig validates slug format", () => {
  setup();
  const config = buildTestConfig({ slug: "INVALID SLUG!" });
  const { errors } = createNicheConfig(config);
  assert.ok(errors.some((e) => e.includes("slug")));
});

// ---------------------------------------------------------------------------
// updateNicheConfig
// ---------------------------------------------------------------------------

test("updateNicheConfig deep merges partial updates", () => {
  setup();
  const updated = updateNicheConfig("pest-control", {
    channels: { responseTimeTarget: 5 },
  });

  assert.ok(updated);
  assert.equal(updated.channels.responseTimeTarget, 5);
  assert.ok(updated.channels.primary.length > 0);
  assert.equal(updated.slug, "pest-control");
});

test("updateNicheConfig returns null for non-existent slug", () => {
  setup();
  const result = updateNicheConfig("non-existent", { name: "Updated" });
  assert.equal(result, null);
});

test("updateNicheConfig preserves slug", () => {
  setup();
  const updated = updateNicheConfig("roofing", { name: "Updated Roofing" });
  assert.ok(updated);
  assert.equal(updated.slug, "roofing");
  assert.equal(updated.name, "Updated Roofing");
});

// ---------------------------------------------------------------------------
// listNicheConfigs
// ---------------------------------------------------------------------------

test("listNicheConfigs returns all built-in configs", () => {
  setup();
  const configs = listNicheConfigs();
  assert.ok(configs.length >= 5);
});

test("listNicheConfigs filters by industry", () => {
  setup();
  const legal = listNicheConfigs({ industry: "legal" });
  assert.ok(legal.length >= 1);
  assert.ok(legal.every((c) => c.industry === "legal"));
});

test("listNicheConfigs respects limit", () => {
  setup();
  const configs = listNicheConfigs({ limit: 2 });
  assert.equal(configs.length, 2);
});

test("listNicheConfigs supports cursor-based pagination", () => {
  setup();
  const first = listNicheConfigs({ limit: 2 });
  assert.equal(first.length, 2);

  const second = listNicheConfigs({ limit: 2, cursor: first[1].slug });
  assert.ok(second.length > 0);
  assert.ok(second[0].slug > first[1].slug);
});

// ---------------------------------------------------------------------------
// deleteNicheConfig
// ---------------------------------------------------------------------------

test("deleteNicheConfig removes a config", () => {
  setup();
  const config = buildTestConfig({ slug: "to-delete" });
  createNicheConfig(config);
  assert.ok(loadNicheConfig("to-delete"));

  const deleted = deleteNicheConfig("to-delete");
  assert.equal(deleted, true);
  assert.equal(loadNicheConfig("to-delete"), null);
});

test("deleteNicheConfig returns false for non-existent slug", () => {
  setup();
  const deleted = deleteNicheConfig("non-existent");
  assert.equal(deleted, false);
});

// ---------------------------------------------------------------------------
// resolveNicheConfig
// ---------------------------------------------------------------------------

test("resolveNicheConfig fills in missing fields with defaults", () => {
  setup();
  const resolved = resolveNicheConfig("pest-control");
  assert.ok(resolved);
  assert.equal(resolved.slug, "pest-control");
  assert.ok(resolved.audience.painPoints.length > 0);
  assert.ok(resolved.scoring.intentWeight > 0);
  assert.ok(resolved.content.ctas.length > 0);
});

test("resolveNicheConfig returns null for non-existent slug", () => {
  setup();
  const result = resolveNicheConfig("non-existent");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// applyNicheToScoring
// ---------------------------------------------------------------------------

test("applyNicheToScoring returns scoring weight overrides", () => {
  setup();
  const config = loadNicheConfig("pest-control");
  assert.ok(config);

  const scoring = applyNicheToScoring(config);
  assert.equal(scoring.intentWeight, config.scoring.intentWeight);
  assert.equal(scoring.fitWeight, config.scoring.fitWeight);
  assert.ok(Object.keys(scoring.sourceWeights).length > 0);
  assert.ok(scoring.urgencyKeywords.length > 0);
});

test("applyNicheToScoring returns independent copies", () => {
  setup();
  const config = loadNicheConfig("pest-control");
  assert.ok(config);

  const scoring = applyNicheToScoring(config);
  scoring.urgencyKeywords.push("extra");

  assert.ok(!config.scoring.urgencyKeywords.includes("extra"));
});

// ---------------------------------------------------------------------------
// applyNicheToOffers
// ---------------------------------------------------------------------------

test("applyNicheToOffers returns offer generation params", () => {
  setup();
  const config = loadNicheConfig("roofing");
  assert.ok(config);

  const offers = applyNicheToOffers(config);
  assert.equal(offers.primaryOffer.name, config.offers.primary.name);
  assert.ok(offers.upsells.length > 0);
  assert.equal(offers.leadMagnet, config.offers.leadMagnet);
  assert.equal(offers.pricingModel, config.offers.pricingModel);
});

// ---------------------------------------------------------------------------
// applyNicheToPsychology
// ---------------------------------------------------------------------------

test("applyNicheToPsychology returns psychology evaluation params", () => {
  setup();
  const config = loadNicheConfig("immigration-law");
  assert.ok(config);

  const psych = applyNicheToPsychology(config);
  assert.equal(psych.primaryFear, config.psychology.primaryFear);
  assert.equal(psych.primaryDesire, config.psychology.primaryDesire);
  assert.ok(psych.trustFactors.length > 0);
  assert.equal(psych.urgencyType, config.audience.urgencyType);
});

// ---------------------------------------------------------------------------
// applyNicheToChannels
// ---------------------------------------------------------------------------

test("applyNicheToChannels returns channel strategy params", () => {
  setup();
  const config = loadNicheConfig("staffing-agency");
  assert.ok(config);

  const channels = applyNicheToChannels(config);
  assert.ok(channels.primaryChannels.length > 0);
  assert.ok(channels.secondaryChannels.length > 0);
  assert.equal(channels.responseTimeTarget, config.channels.responseTimeTarget);
  assert.equal(channels.preferredFunnelFamily, config.funnels.preferredFamily);
});

// ---------------------------------------------------------------------------
// generateNicheConfigFromDesignSpec
// ---------------------------------------------------------------------------

test("generateNicheConfigFromDesignSpec creates config from design spec", () => {
  setup();
  const designSpec = {
    niche: {
      name: "Plumbing Services",
      industry: "construction",
      icp: {
        painPoints: ["Slow response times", "Overpriced competitors"],
        urgencyTriggers: ["emergency leak", "pipe burst"],
        demographics: "Homeowners in suburban areas",
        decisionMakers: ["homeowner"],
      },
    },
    offers: {
      core: { name: "Emergency Plumbing Service", price: 299, description: "24/7 plumbing service" },
      upsells: [{ name: "Annual Maintenance Plan", price: 199 }],
      leadMagnets: [{ name: "Home Plumbing Checklist" }],
    },
    psychology: {
      urgencyTriggers: [{ type: "countdown", message: "Limited same-day slots" }],
      trustBuilders: [{ type: "guarantee", content: "No fix, no fee" }],
      objectionHandlers: [{ objection: "Too expensive", response: "Compare our value" }],
    },
  };

  const config = generateNicheConfigFromDesignSpec(designSpec);

  assert.equal(config.slug, "plumbing-services");
  assert.equal(config.name, "Plumbing Services");
  assert.equal(config.industry, "construction");
  assert.ok(config.audience.painPoints.includes("Slow response times"));
  assert.equal(config.audience.urgencyType, "emergency");
  assert.equal(config.offers.primary.name, "Emergency Plumbing Service");
  assert.ok(config.offers.upsells.length > 0);
  assert.equal(config.offers.leadMagnet, "Home Plumbing Checklist");
  assert.ok(config.psychology.objectionPatterns.includes("Too expensive"));
});

test("generateNicheConfigFromDesignSpec handles minimal spec", () => {
  setup();
  const minimal = {
    niche: {
      name: "Minimal Niche",
      icp: {
        painPoints: ["One pain point"],
      },
    },
  };

  const config = generateNicheConfigFromDesignSpec(minimal);
  assert.equal(config.slug, "minimal-niche");
  assert.equal(config.industry, "general");
  assert.ok(config.channels.primary.length > 0);
  assert.ok(config.scoring.intentWeight > 0);
});

// ---------------------------------------------------------------------------
// exportNicheConfigAsDesignMd
// ---------------------------------------------------------------------------

test("exportNicheConfigAsDesignMd produces valid markdown", () => {
  setup();
  const config = loadNicheConfig("pest-control");
  assert.ok(config);

  const md = exportNicheConfigAsDesignMd(config);
  assert.ok(md.includes("# DESIGN.md - Pest Control Services"));
  assert.ok(md.includes("## Niche"));
  assert.ok(md.includes("## Audience"));
  assert.ok(md.includes("## Scoring"));
  assert.ok(md.includes("## Offers"));
  assert.ok(md.includes("## Psychology"));
  assert.ok(md.includes("## Channels"));
  assert.ok(md.includes("## Funnels"));
  assert.ok(md.includes("## Monetization"));
  assert.ok(md.includes("## Content"));
  assert.ok(md.includes("pest-control"));
});

test("exportNicheConfigAsDesignMd includes all major sections", () => {
  setup();
  const config = loadNicheConfig("roofing");
  assert.ok(config);

  const md = exportNicheConfigAsDesignMd(config);
  assert.ok(md.includes(config.offers.primary.name));
  assert.ok(md.includes(config.psychology.primaryFear));
  assert.ok(md.includes(config.funnels.preferredFamily));
  assert.ok(md.includes(String(config.monetization.marginTarget)));
});

// ---------------------------------------------------------------------------
// resetNicheConfigStore
// ---------------------------------------------------------------------------

test("resetNicheConfigStore clears custom configs but restores built-ins", () => {
  setup();
  createNicheConfig(buildTestConfig({ slug: "custom-one" }));
  assert.ok(loadNicheConfig("custom-one"));

  resetNicheConfigStore();
  assert.equal(loadNicheConfig("custom-one"), null);
  assert.ok(loadNicheConfig("pest-control"));
});

// ---------------------------------------------------------------------------
// Built-in config completeness
// ---------------------------------------------------------------------------

test("all built-in configs have complete required fields", () => {
  setup();
  for (const slug of getBuiltInSlugs()) {
    const config = loadNicheConfig(slug);
    assert.ok(config, `Config for ${slug} should exist`);
    assert.ok(config.slug, `${slug} should have slug`);
    assert.ok(config.name, `${slug} should have name`);
    assert.ok(config.industry, `${slug} should have industry`);
    assert.ok(config.audience.painPoints.length > 0, `${slug} should have pain points`);
    assert.ok(config.audience.decisionMakers.length > 0, `${slug} should have decision makers`);
    assert.ok(config.scoring.urgencyKeywords.length > 0, `${slug} should have urgency keywords`);
    assert.ok(config.offers.primary.name, `${slug} should have primary offer`);
    assert.ok(config.psychology.primaryFear, `${slug} should have primary fear`);
    assert.ok(config.channels.primary.length > 0, `${slug} should have primary channels`);
    assert.ok(config.content.headlines.cold, `${slug} should have cold headline`);
    assert.ok(config.content.headlines.burning, `${slug} should have burning headline`);
  }
});

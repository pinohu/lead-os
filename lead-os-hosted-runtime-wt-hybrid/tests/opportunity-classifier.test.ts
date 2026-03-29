import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyBusiness,
  classifyAll,
  REVENUE_MODEL_LABELS,
  type ClassifiedOpportunity,
  type ClassificationResult,
} from "../src/lib/opportunity-classifier.ts";
import type { ScoredBusiness, BusinessQualitySignals } from "../src/lib/discovery-scout.ts";

function makeScoredBusiness(overrides: Partial<ScoredBusiness> = {}): ScoredBusiness {
  const defaults: ScoredBusiness = {
    id: `prospect_${Date.now()}_test`,
    name: "Test Business",
    address: "100 Test St",
    niche: "plumbing",
    geo: "Austin, TX",
    discoveredAt: new Date().toISOString(),
    qualitySignals: {
      hasWebsite: false,
      websiteQuality: 0,
      hasPhone: true,
      hasEmail: false,
      reviewScore: 50,
      reviewVolume: 30,
      digitalPresenceGap: 70,
      growthIndicators: [],
      weaknesses: ["no-website"],
    },
    opportunityScore: 50,
    digitalGapScore: 70,
    affiliatePotential: 10,
    partnerPotential: 20,
  };

  if (overrides.qualitySignals) {
    defaults.qualitySignals = { ...defaults.qualitySignals, ...overrides.qualitySignals };
  }

  return { ...defaults, ...overrides, qualitySignals: overrides.qualitySignals ? { ...defaults.qualitySignals, ...overrides.qualitySignals } : defaults.qualitySignals };
}

// ---------------------------------------------------------------------------
// classifyBusiness — high-opportunity managed service candidate
// ---------------------------------------------------------------------------

describe("classifyBusiness", () => {
  it("classifies a no-website, high-review business as managed-service hot/warm", () => {
    const business = makeScoredBusiness({
      rating: 4.6,
      reviewCount: 100,
      qualitySignals: {
        hasWebsite: false,
        websiteQuality: 0,
        hasPhone: true,
        hasEmail: false,
        reviewScore: 74,
        reviewVolume: 50,
        digitalPresenceGap: 95,
        growthIndicators: ["high-customer-satisfaction", "established-reputation", "strong-offline-weak-online"],
        weaknesses: ["no-website"],
      },
      opportunityScore: 75,
      digitalGapScore: 95,
      affiliatePotential: 5,
      partnerPotential: 50,
    });

    const result = classifyBusiness(business);

    assert.ok(result.opportunities.length >= 1);
    const managed = result.opportunities.find((o) => o.type === "managed-service");
    assert.ok(managed, "Should have managed-service opportunity");
    assert.ok(["hot", "warm"].includes(managed.priority), `Expected hot/warm, got ${managed.priority}`);
    assert.ok(managed.confidence >= 40, `Confidence should be >= 40, got ${managed.confidence}`);
    assert.ok(managed.estimatedMonthlyValue > 0, "Should have positive estimated value");
    assert.ok(managed.outreachTemplate.length > 0, "Should have outreach template");
    assert.strictEqual(managed.suggestedRevenueModel, 1);
  });

  it("classifies a low-signal business as cold with fallback opportunity", () => {
    const business = makeScoredBusiness({
      qualitySignals: {
        hasWebsite: false,
        websiteQuality: 0,
        hasPhone: false,
        hasEmail: false,
        reviewScore: 20,
        reviewVolume: 5,
        digitalPresenceGap: 30,
        growthIndicators: [],
        weaknesses: ["no-website"],
      },
      opportunityScore: 15,
      digitalGapScore: 30,
      affiliatePotential: 5,
      partnerPotential: 10,
    });

    const result = classifyBusiness(business);

    assert.strictEqual(result.opportunities.length, 1);
    assert.strictEqual(result.primaryOpportunity.priority, "cold");
    assert.strictEqual(result.primaryOpportunity.confidence, 10);
    assert.strictEqual(result.primaryOpportunity.estimatedMonthlyValue, 0);
    assert.strictEqual(result.primaryOpportunity.outreachTemplate, "");
  });

  it("classifies a good-website business as white-label candidate", () => {
    const business = makeScoredBusiness({
      website: "https://decent-site.com",
      qualitySignals: {
        hasWebsite: true,
        websiteQuality: 65,
        hasPhone: true,
        hasEmail: true,
        reviewScore: 55,
        reviewVolume: 40,
        digitalPresenceGap: 40,
        growthIndicators: ["digital-aware"],
        weaknesses: ["no-live-chat", "no-online-booking", "weak-cta-presence"],
      },
      opportunityScore: 45,
      digitalGapScore: 40,
      affiliatePotential: 30,
      partnerPotential: 25,
    });

    const result = classifyBusiness(business);

    const whiteLabel = result.opportunities.find((o) => o.type === "white-label");
    assert.ok(whiteLabel, "Should have white-label opportunity");
    assert.strictEqual(whiteLabel.suggestedRevenueModel, 2);
    assert.ok(whiteLabel.estimatedMonthlyValue > 0);
    assert.ok(whiteLabel.outreachTemplate.length > 0);
  });

  it("classifies a high-affiliate-potential business as affiliate", () => {
    const business = makeScoredBusiness({
      website: "https://great-site.com",
      rating: 4.9,
      reviewCount: 300,
      qualitySignals: {
        hasWebsite: true,
        websiteQuality: 80,
        hasPhone: true,
        hasEmail: true,
        reviewScore: 78,
        reviewVolume: 80,
        digitalPresenceGap: 15,
        growthIndicators: ["high-customer-satisfaction", "established-reputation", "high-volume-business", "digital-aware"],
        weaknesses: [],
      },
      opportunityScore: 40,
      digitalGapScore: 15,
      affiliatePotential: 70,
      partnerPotential: 60,
    });

    const result = classifyBusiness(business);

    const affiliate = result.opportunities.find((o) => o.type === "affiliate");
    assert.ok(affiliate, "Should have affiliate opportunity");
    assert.strictEqual(affiliate.suggestedRevenueModel, 4);
    assert.ok(affiliate.estimatedMonthlyValue > 0);
    assert.ok(affiliate.outreachTemplate.includes("Partnership"));
  });

  it("classifies a partner candidate with high partner potential", () => {
    const business = makeScoredBusiness({
      niche: "real-estate",
      rating: 4.5,
      reviewCount: 150,
      qualitySignals: {
        hasWebsite: true,
        websiteQuality: 50,
        hasPhone: true,
        hasEmail: true,
        reviewScore: 65,
        reviewVolume: 60,
        digitalPresenceGap: 50,
        growthIndicators: ["established-reputation", "high-volume-business"],
        weaknesses: ["no-live-chat"],
      },
      opportunityScore: 55,
      digitalGapScore: 50,
      affiliatePotential: 40,
      partnerPotential: 65,
    });

    const result = classifyBusiness(business);

    const partner = result.opportunities.find((o) => o.type === "referral-partner");
    assert.ok(partner, "Should have referral-partner opportunity");
    assert.strictEqual(partner.suggestedRevenueModel, 4);
    assert.ok(partner.estimatedMonthlyValue > 0);
    assert.ok(partner.outreachTemplate.includes("referral"));
  });

  it("sorts opportunities by confidence descending", () => {
    const business = makeScoredBusiness({
      website: "https://mediocre.com",
      rating: 4.6,
      reviewCount: 200,
      qualitySignals: {
        hasWebsite: true,
        websiteQuality: 35,
        hasPhone: true,
        hasEmail: true,
        reviewScore: 74,
        reviewVolume: 70,
        digitalPresenceGap: 85,
        growthIndicators: ["high-customer-satisfaction", "established-reputation", "high-volume-business"],
        weaknesses: ["poor-website-quality", "below-average-website", "no-live-chat", "no-online-booking"],
      },
      opportunityScore: 70,
      digitalGapScore: 85,
      affiliatePotential: 50,
      partnerPotential: 55,
    });

    const result = classifyBusiness(business);

    for (let i = 1; i < result.opportunities.length; i++) {
      assert.ok(
        result.opportunities[i - 1].confidence >= result.opportunities[i].confidence,
        "Opportunities should be sorted by confidence descending",
      );
    }
    assert.strictEqual(result.primaryOpportunity, result.opportunities[0]);
  });

  it("computes totalEstimatedValue as sum of all opportunity values", () => {
    const business = makeScoredBusiness({
      website: "https://mediocre.com",
      rating: 4.6,
      reviewCount: 200,
      qualitySignals: {
        hasWebsite: true,
        websiteQuality: 35,
        hasPhone: true,
        hasEmail: true,
        reviewScore: 74,
        reviewVolume: 70,
        digitalPresenceGap: 85,
        growthIndicators: ["high-customer-satisfaction", "established-reputation", "high-volume-business"],
        weaknesses: ["poor-website-quality", "below-average-website", "no-live-chat"],
      },
      opportunityScore: 70,
      digitalGapScore: 85,
      affiliatePotential: 50,
      partnerPotential: 55,
    });

    const result = classifyBusiness(business);
    const expectedTotal = result.opportunities.reduce((sum, o) => sum + o.estimatedMonthlyValue, 0);
    assert.strictEqual(result.totalEstimatedValue, expectedTotal);
  });

  it("assigns correct estimated value tiers for managed-service", () => {
    const makeManaged = (reviewScore: number) =>
      makeScoredBusiness({
        qualitySignals: {
          hasWebsite: false,
          websiteQuality: 0,
          hasPhone: true,
          hasEmail: false,
          reviewScore,
          reviewVolume: 50,
          digitalPresenceGap: 95,
          growthIndicators: ["strong-offline-weak-online", "established-reputation"],
          weaknesses: ["no-website"],
        },
        opportunityScore: 70,
        digitalGapScore: 95,
        affiliatePotential: 5,
        partnerPotential: 30,
      });

    const highReview = classifyBusiness(makeManaged(75));
    const midReview = classifyBusiness(makeManaged(55));
    const lowReview = classifyBusiness(makeManaged(45));

    const highManaged = highReview.opportunities.find((o) => o.type === "managed-service");
    const midManaged = midReview.opportunities.find((o) => o.type === "managed-service");
    const lowManaged = lowReview.opportunities.find((o) => o.type === "managed-service");

    assert.ok(highManaged);
    assert.ok(midManaged);
    assert.ok(lowManaged);
    assert.strictEqual(highManaged.estimatedMonthlyValue, 5000);
    assert.strictEqual(midManaged.estimatedMonthlyValue, 3000);
    assert.strictEqual(lowManaged.estimatedMonthlyValue, 2000);
  });
});

// ---------------------------------------------------------------------------
// classifyAll
// ---------------------------------------------------------------------------

describe("classifyAll", () => {
  it("classifies an array of businesses and sorts by primary confidence", () => {
    const businesses = [
      makeScoredBusiness({
        id: "low",
        qualitySignals: {
          hasWebsite: false,
          websiteQuality: 0,
          hasPhone: false,
          hasEmail: false,
          reviewScore: 10,
          reviewVolume: 2,
          digitalPresenceGap: 20,
          growthIndicators: [],
          weaknesses: ["no-website"],
        },
        opportunityScore: 10,
        digitalGapScore: 20,
        affiliatePotential: 5,
        partnerPotential: 5,
      }),
      makeScoredBusiness({
        id: "high",
        qualitySignals: {
          hasWebsite: false,
          websiteQuality: 0,
          hasPhone: true,
          hasEmail: false,
          reviewScore: 74,
          reviewVolume: 50,
          digitalPresenceGap: 95,
          growthIndicators: ["strong-offline-weak-online", "established-reputation"],
          weaknesses: ["no-website"],
        },
        opportunityScore: 75,
        digitalGapScore: 95,
        affiliatePotential: 5,
        partnerPotential: 40,
      }),
    ];

    const results = classifyAll(businesses);

    assert.strictEqual(results.length, 2);
    assert.ok(
      results[0].primaryOpportunity.confidence >= results[1].primaryOpportunity.confidence,
      "Results should be sorted by primary opportunity confidence",
    );
  });

  it("handles empty array", () => {
    const results = classifyAll([]);
    assert.deepStrictEqual(results, []);
  });

  it("returns one ClassificationResult per input business", () => {
    const businesses = Array.from({ length: 5 }, (_, i) =>
      makeScoredBusiness({ id: `biz-${i}`, name: `Business ${i}` }),
    );

    const results = classifyAll(businesses);
    assert.strictEqual(results.length, 5);

    for (const result of results) {
      assert.ok(result.business);
      assert.ok(result.opportunities.length >= 1);
      assert.ok(result.primaryOpportunity);
      assert.ok(typeof result.totalEstimatedValue === "number");
    }
  });
});

// ---------------------------------------------------------------------------
// REVENUE_MODEL_LABELS
// ---------------------------------------------------------------------------

describe("REVENUE_MODEL_LABELS", () => {
  it("has entries for models 1-4", () => {
    assert.ok(REVENUE_MODEL_LABELS[1].includes("Managed"));
    assert.ok(REVENUE_MODEL_LABELS[2].includes("White-label"));
    assert.ok(REVENUE_MODEL_LABELS[3].includes("Implementation"));
    assert.ok(REVENUE_MODEL_LABELS[4].includes("marketplace"));
  });
});

// ---------------------------------------------------------------------------
// Outreach template validation
// ---------------------------------------------------------------------------

describe("outreach templates", () => {
  it("managed-service template contains business name and weakness count", () => {
    const business = makeScoredBusiness({
      name: "Acme Plumbing",
      qualitySignals: {
        hasWebsite: false,
        websiteQuality: 0,
        hasPhone: true,
        hasEmail: false,
        reviewScore: 65,
        reviewVolume: 50,
        digitalPresenceGap: 95,
        growthIndicators: ["strong-offline-weak-online"],
        weaknesses: ["no-website"],
      },
      opportunityScore: 70,
      digitalGapScore: 95,
      affiliatePotential: 5,
      partnerPotential: 20,
    });

    const result = classifyBusiness(business);
    const managed = result.opportunities.find((o) => o.type === "managed-service");
    assert.ok(managed);
    assert.ok(managed.outreachTemplate.includes("Acme Plumbing"));
    assert.ok(managed.outreachTemplate.includes("Subject:"));
  });

  it("affiliate template mentions partnership", () => {
    const business = makeScoredBusiness({
      name: "Top Dental",
      website: "https://topdental.com",
      rating: 4.8,
      reviewCount: 300,
      qualitySignals: {
        hasWebsite: true,
        websiteQuality: 75,
        hasPhone: true,
        hasEmail: true,
        reviewScore: 77,
        reviewVolume: 80,
        digitalPresenceGap: 15,
        growthIndicators: ["high-customer-satisfaction", "established-reputation", "high-volume-business", "digital-aware"],
        weaknesses: [],
      },
      opportunityScore: 35,
      digitalGapScore: 15,
      affiliatePotential: 65,
      partnerPotential: 55,
    });

    const result = classifyBusiness(business);
    const affiliate = result.opportunities.find((o) => o.type === "affiliate");
    assert.ok(affiliate);
    assert.ok(affiliate.outreachTemplate.includes("Top Dental"));
  });
});

import test, { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  scoreBusiness,
  computeWebsiteQuality,
  assessDigitalPresenceGap,
  getComplementaryNiches,
  type DiscoveredBusiness,
} from "../src/lib/discovery-scout.ts";

function makeBaseBusiness(overrides: Partial<DiscoveredBusiness> = {}): DiscoveredBusiness {
  return {
    name: "Test Biz",
    address: "123 Main St",
    niche: "plumbing",
    geo: "Austin, TX",
    discoveredAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDesignIngestion(overrides: Record<string, unknown> = {}) {
  return {
    layout: { sectionCount: 5, ...((overrides.layout as Record<string, unknown>) ?? {}) },
    copy: {
      headlines: ["Welcome", "Services"],
      ctaLabels: ["Call Now", "Book Online"],
      ...((overrides.copy as Record<string, unknown>) ?? {}),
    },
    funnel: {
      hasChat: false,
      hasBooking: false,
      hasPricing: false,
      hasTestimonials: false,
      hasVideo: false,
      hasFaq: false,
      ...((overrides.funnel as Record<string, unknown>) ?? {}),
    },
    tokens: {
      colors: { all: ["#fff", "#000", "#ccc"] },
      ...((overrides.tokens as Record<string, unknown>) ?? {}),
    },
  } as ReturnType<typeof computeWebsiteQuality> extends number ? Parameters<typeof computeWebsiteQuality>[0] : never;
}

// ---------------------------------------------------------------------------
// scoreBusiness
// ---------------------------------------------------------------------------

describe("scoreBusiness", () => {
  it("scores a high-rated business without a website as high opportunity", () => {
    const business = makeBaseBusiness({
      rating: 4.8,
      reviewCount: 120,
      phone: "555-1234",
    });

    const scored = scoreBusiness(business);

    assert.ok(scored.id.startsWith("prospect_"));
    assert.ok(scored.opportunityScore >= 50, `Expected >= 50, got ${scored.opportunityScore}`);
    assert.ok(scored.digitalGapScore >= 70, `Expected high digital gap, got ${scored.digitalGapScore}`);
    assert.strictEqual(scored.qualitySignals.hasWebsite, false);
    assert.strictEqual(scored.qualitySignals.hasPhone, true);
    assert.ok(scored.qualitySignals.growthIndicators.includes("strong-offline-weak-online"));
    assert.ok(scored.qualitySignals.weaknesses.includes("no-website"));
  });

  it("scores a low-rated business without website as lower opportunity", () => {
    const business = makeBaseBusiness({
      rating: 2.5,
      reviewCount: 3,
    });

    const scored = scoreBusiness(business);

    assert.ok(scored.opportunityScore < 60, `Expected < 60, got ${scored.opportunityScore}`);
    assert.strictEqual(scored.qualitySignals.hasWebsite, false);
    assert.strictEqual(scored.qualitySignals.hasPhone, false);
    assert.strictEqual(scored.qualitySignals.hasEmail, false);
  });

  it("scores a business with website and design ingestion", () => {
    const business = makeBaseBusiness({
      website: "https://example.com",
      rating: 4.2,
      reviewCount: 80,
      phone: "555-5678",
      email: "info@example.com",
    });

    const ingestion = makeDesignIngestion({
      funnel: {
        hasChat: true,
        hasBooking: true,
        hasPricing: true,
        hasTestimonials: true,
        hasVideo: true,
        hasFaq: true,
      },
      layout: { sectionCount: 8 },
      copy: { headlines: ["H1", "H2", "H3", "H4"], ctaLabels: ["CTA1", "CTA2", "CTA3"] },
      tokens: { colors: { all: ["#fff", "#000", "#ccc", "#aaa", "#bbb", "#ddd", "#eee", "#111"] } },
    });

    const scored = scoreBusiness(business, ingestion as any);

    assert.strictEqual(scored.qualitySignals.hasWebsite, true);
    assert.strictEqual(scored.qualitySignals.hasPhone, true);
    assert.strictEqual(scored.qualitySignals.hasEmail, true);
    assert.ok(scored.qualitySignals.websiteQuality > 50, `Expected decent quality, got ${scored.qualitySignals.websiteQuality}`);
    assert.ok(scored.digitalGapScore < 40, `Expected low gap for good site, got ${scored.digitalGapScore}`);
  });

  it("assigns affiliate potential of 5 when no website", () => {
    const business = makeBaseBusiness({ rating: 4.5, reviewCount: 100 });
    const scored = scoreBusiness(business);
    assert.strictEqual(scored.affiliatePotential, 5);
  });

  it("detects growth indicators correctly", () => {
    const highVolume = makeBaseBusiness({
      rating: 4.7,
      reviewCount: 250,
      website: "https://busy.com",
    });
    const scored = scoreBusiness(highVolume);

    assert.ok(scored.qualitySignals.growthIndicators.includes("high-customer-satisfaction"));
    assert.ok(scored.qualitySignals.growthIndicators.includes("established-reputation"));
    assert.ok(scored.qualitySignals.growthIndicators.includes("high-volume-business"));
    assert.ok(scored.qualitySignals.growthIndicators.includes("digital-aware"));
  });

  it("handles missing rating and review count", () => {
    const business = makeBaseBusiness({});
    const scored = scoreBusiness(business);

    assert.strictEqual(scored.qualitySignals.reviewScore, 0);
    assert.strictEqual(scored.qualitySignals.reviewVolume, 0);
    assert.ok(scored.qualitySignals.growthIndicators.length === 0);
  });

  it("handles zero rating", () => {
    const business = makeBaseBusiness({ rating: 0, reviewCount: 0 });
    const scored = scoreBusiness(business);

    assert.strictEqual(scored.qualitySignals.reviewScore, 0);
    assert.strictEqual(scored.qualitySignals.reviewVolume, 0);
  });

  it("preserves original business fields in scored output", () => {
    const business = makeBaseBusiness({
      name: "Ace Plumbing",
      address: "456 Oak Ave",
      phone: "555-9999",
      email: "ace@plumb.com",
      website: "https://aceplumb.com",
      niche: "plumbing",
      geo: "Denver, CO",
    });

    const scored = scoreBusiness(business);

    assert.strictEqual(scored.name, "Ace Plumbing");
    assert.strictEqual(scored.address, "456 Oak Ave");
    assert.strictEqual(scored.phone, "555-9999");
    assert.strictEqual(scored.email, "ace@plumb.com");
    assert.strictEqual(scored.website, "https://aceplumb.com");
    assert.strictEqual(scored.niche, "plumbing");
    assert.strictEqual(scored.geo, "Denver, CO");
  });
});

// ---------------------------------------------------------------------------
// computeWebsiteQuality
// ---------------------------------------------------------------------------

describe("computeWebsiteQuality", () => {
  it("returns 0 when no design ingestion provided", () => {
    assert.strictEqual(computeWebsiteQuality(undefined), 0);
  });

  it("scores a minimal site low", () => {
    const ingestion = makeDesignIngestion({
      layout: { sectionCount: 1 },
      copy: { headlines: [], ctaLabels: [] },
      funnel: {
        hasChat: false,
        hasBooking: false,
        hasPricing: false,
        hasTestimonials: false,
        hasVideo: false,
        hasFaq: false,
      },
      tokens: { colors: { all: ["#000"] } },
    });

    const score = computeWebsiteQuality(ingestion as any);
    assert.ok(score < 15, `Expected low score, got ${score}`);
  });

  it("scores a feature-rich site high", () => {
    const ingestion = makeDesignIngestion({
      layout: { sectionCount: 10 },
      copy: { headlines: ["A", "B", "C", "D", "E"], ctaLabels: ["X", "Y"] },
      funnel: {
        hasChat: true,
        hasBooking: true,
        hasPricing: true,
        hasTestimonials: true,
        hasVideo: true,
        hasFaq: true,
      },
      tokens: { colors: { all: ["#fff", "#000", "#ccc", "#aaa", "#bbb", "#ddd", "#eee", "#111"] } },
    });

    const score = computeWebsiteQuality(ingestion as any);
    assert.ok(score >= 80, `Expected high score, got ${score}`);
  });

  it("caps score at 100", () => {
    const ingestion = makeDesignIngestion({
      layout: { sectionCount: 50 },
      copy: { headlines: Array(20).fill("H"), ctaLabels: Array(10).fill("C") },
      funnel: {
        hasChat: true,
        hasBooking: true,
        hasPricing: true,
        hasTestimonials: true,
        hasVideo: true,
        hasFaq: true,
      },
      tokens: { colors: { all: Array(20).fill("#aaa") } },
    });

    const score = computeWebsiteQuality(ingestion as any);
    assert.ok(score <= 100, `Score should cap at 100, got ${score}`);
  });
});

// ---------------------------------------------------------------------------
// assessDigitalPresenceGap
// ---------------------------------------------------------------------------

describe("assessDigitalPresenceGap", () => {
  it("returns 95 when no website and high review score", () => {
    assert.strictEqual(assessDigitalPresenceGap(false, 0, 75), 95);
  });

  it("returns 70 when no website and low review score", () => {
    assert.strictEqual(assessDigitalPresenceGap(false, 0, 30), 70);
  });

  it("returns 85 when website quality < 30 and review score > 60", () => {
    assert.strictEqual(assessDigitalPresenceGap(true, 20, 65), 85);
  });

  it("returns 65 when website quality < 50 and review score > 50", () => {
    assert.strictEqual(assessDigitalPresenceGap(true, 45, 55), 65);
  });

  it("returns 40 when website quality < 70", () => {
    assert.strictEqual(assessDigitalPresenceGap(true, 60, 30), 40);
  });

  it("returns low score for high quality website", () => {
    const gap = assessDigitalPresenceGap(true, 90, 80);
    assert.ok(gap < 20, `Expected low gap for high quality site, got ${gap}`);
  });
});

// ---------------------------------------------------------------------------
// getComplementaryNiches
// ---------------------------------------------------------------------------

describe("getComplementaryNiches", () => {
  it("returns complementary niches for plumbing", () => {
    const niches = getComplementaryNiches("plumbing");
    assert.ok(niches.includes("home-services"));
    assert.ok(niches.includes("hvac"));
    assert.ok(niches.includes("electrical"));
  });

  it("returns complementary niches for legal", () => {
    const niches = getComplementaryNiches("legal");
    assert.ok(niches.includes("insurance"));
    assert.ok(niches.includes("finance"));
    assert.ok(niches.includes("real-estate"));
  });

  it("returns empty array for unknown niche", () => {
    const niches = getComplementaryNiches("underwater-basket-weaving");
    assert.deepStrictEqual(niches, []);
  });

  it("is case-insensitive via lowercase normalization", () => {
    const upper = getComplementaryNiches("Plumbing");
    const lower = getComplementaryNiches("plumbing");
    assert.deepStrictEqual(upper, lower);
    assert.ok(lower.length > 0);
  });

  it("returns correct niches for all mapped keys", () => {
    const knownNiches = [
      "home-services", "legal", "coaching", "real-estate",
      "insurance", "finance", "dental", "health", "fitness",
      "roofing", "plumbing", "hvac", "electrical", "solar",
    ];

    for (const niche of knownNiches) {
      const result = getComplementaryNiches(niche);
      assert.ok(result.length > 0, `Expected complements for ${niche}`);
    }
  });
});

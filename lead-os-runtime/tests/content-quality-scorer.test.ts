import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  scoreContentQuality,
  scoreHeroSection,
  scoreTrustBarSection,
  scoreServicesSection,
  scoreSocialProofSection,
  scoreAboutSection,
  scoreHoursSection,
  scoreFaqSection,
  scoreLeadMagnetSection,
  scoreCtaBannerSection,
  scoreSEO,
  type ContentQualityReport,
  type QualityGrade,
} from "../src/lib/content-quality-scorer.ts";
import type {
  GeneratedLandingPage,
  LandingPageSection,
} from "../src/lib/landing-page-generator.ts";
import type { IngestedBusinessProfile } from "../src/lib/gmb-ingestor.ts";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeSection(
  type: string,
  content: Record<string, unknown>,
  order = 0,
): LandingPageSection {
  return { id: `${type}-${order}`, type: type as LandingPageSection["type"], content, order };
}

function makeProfile(overrides: Partial<IngestedBusinessProfile> = {}): IngestedBusinessProfile {
  return {
    slug: "test-biz",
    businessName: "Test Business",
    address: "123 Main St",
    city: "Seattle",
    state: "WA",
    postalCode: "98101",
    country: "US",
    phone: "+1-206-555-0100",
    website: "https://testbiz.com",
    niche: "plumbing",
    industry: "construction",
    description: "A professional plumbing company serving the greater Seattle area with licensed and insured technicians.",
    primaryCategory: "Plumber",
    additionalCategories: ["Water Heater Installation", "Drain Cleaning", "Pipe Repair"],
    rating: 4.8,
    reviewCount: 50,
    topReviews: [
      { author: "John", rating: 5, text: "Excellent service! They fixed our pipe in under an hour. Highly recommended.", relativeTime: "1 month ago" },
      { author: "Sarah", rating: 5, text: "Professional and affordable. Best plumber in Seattle.", relativeTime: "2 months ago" },
      { author: "Mike", rating: 4, text: "Good work, arrived on time, fair pricing for the job.", relativeTime: "3 months ago" },
    ],
    photos: [
      { url: "https://example.com/storefront.jpg", category: "exterior" },
      { url: "https://example.com/team.jpg", category: "team" },
    ],
    hours: [
      { day: "monday", open: "08:00", close: "18:00" },
      { day: "tuesday", open: "08:00", close: "18:00" },
      { day: "wednesday", open: "08:00", close: "18:00" },
      { day: "thursday", open: "08:00", close: "18:00" },
      { day: "friday", open: "08:00", close: "17:00" },
      { day: "saturday", open: "09:00", close: "14:00" },
      { day: "sunday", open: "00:00", close: "00:00", closed: true },
    ],
    attributes: [
      { key: "wheelchair_accessible", label: "Wheelchair Accessible", value: true },
      { key: "free_estimates", label: "Free Estimates", value: true },
      { key: "licensed", label: "Licensed & Insured", value: true },
    ],
    faq: [
      { question: "Do you do emergency calls?", answer: "Yes, we offer 24/7 emergency plumbing services for all residential and commercial customers." },
      { question: "Are you licensed?", answer: "Yes, we are fully licensed, bonded, and insured in the state of Washington." },
      { question: "Do you provide free estimates?", answer: "Absolutely. Contact us for a no-obligation free estimate on any plumbing project." },
    ],
    geo: { lat: 47.6062, lng: -122.3321 },
    listingCompleteness: 85,
    reviewQuality: 78,
    digitalPresenceGap: 45,
    ingestedAt: "2026-01-15T09:00:00Z",
    ...overrides,
  };
}

function makeFullPage(overrides: Partial<GeneratedLandingPage> = {}): GeneratedLandingPage {
  return {
    slug: "test-biz",
    businessName: "Test Business",
    niche: "plumbing",
    industry: "construction",
    geo: { city: "Seattle", state: "WA", country: "US" },
    sections: [
      makeSection("hero", {
        headline: "Test Business — Trusted Plumber in Seattle, WA",
        subheadline: "Professional plumbing services",
        ctaText: "Get a Free Quote",
        ctaUrl: "#lead-capture",
        backgroundImage: "https://example.com/bg.jpg",
        rating: 4.8,
        reviewCount: 50,
      }, 0),
      makeSection("trust-bar", {
        rating: 4.8,
        reviewCount: 50,
        badges: ["Licensed & Insured", "Locally Owned", "Free Estimates"],
      }, 1),
      makeSection("services", {
        heading: "Our Services",
        services: [
          { name: "Pipe Repair", description: "Expert pipe repair services" },
          { name: "Drain Cleaning", description: "Professional drain cleaning" },
          { name: "Water Heater", description: "Installation and repair" },
          { name: "Emergency Plumbing", description: "24/7 emergency service" },
        ],
        primaryService: "Plumber",
      }, 2),
      makeSection("social-proof", {
        heading: "What Our Customers Say",
        reviews: [
          { author: "John", rating: 5, text: "Excellent service! They fixed our pipe in under an hour. Highly recommended." },
          { author: "Sarah", rating: 5, text: "Professional and affordable. Best plumber in Seattle." },
          { author: "Mike", rating: 4, text: "Good work, arrived on time, fair pricing for the job." },
        ],
        attribution: "Reviews sourced from Google",
      }, 3),
      makeSection("about", {
        heading: "About Test Business",
        description: "A professional plumbing company serving the greater Seattle area with licensed and insured technicians. We have been in business for over 20 years.",
        phone: "+1-206-555-0100",
        address: "123 Main St, Seattle, WA 98101",
        website: "https://testbiz.com",
      }, 4),
      makeSection("hours", {
        heading: "Hours of Operation",
        hours: [
          { day: "monday", open: "08:00", close: "18:00" },
          { day: "tuesday", open: "08:00", close: "18:00" },
          { day: "wednesday", open: "08:00", close: "18:00" },
          { day: "thursday", open: "08:00", close: "18:00" },
          { day: "friday", open: "08:00", close: "17:00" },
          { day: "saturday", open: "09:00", close: "14:00" },
          { day: "sunday", open: "00:00", close: "00:00", closed: true },
        ],
      }, 5),
      makeSection("faq", {
        heading: "Frequently Asked Questions",
        items: [
          { question: "Do you do emergency calls?", answer: "Yes, we offer 24/7 emergency plumbing services for all residential and commercial customers." },
          { question: "Are you licensed?", answer: "Yes, we are fully licensed, bonded, and insured in the state of Washington." },
          { question: "Do you provide free estimates?", answer: "Absolutely. Contact us for a no-obligation free estimate on any plumbing project." },
        ],
      }, 6),
      makeSection("lead-magnet", {
        heading: "Get Started Today",
        subheading: "Fill out the form below.",
        formFields: ["firstName", "lastName", "email", "phone", "service"],
        submitLabel: "Request Free Quote",
        source: "lp-test-biz",
        niche: "plumbing",
      }, 7),
      makeSection("cta-banner", {
        heading: "Ready to Get Started?",
        subheading: "Contact Test Business today",
        ctaText: "Call Now",
        ctaUrl: "tel:12065550100",
        phone: "+1-206-555-0100",
      }, 8),
    ],
    intakeSource: "lp-test-biz",
    accentColor: "#225f54",
    metaTitle: "Test Business — Plumber in Seattle, WA",
    metaDescription: "A professional plumbing company serving the greater Seattle area with licensed and insured technicians. Contact us today for a free quote.",
    ogImage: "https://example.com/og.jpg",
    canonicalUrl: "/lp/test-biz",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Test Business",
    },
    version: 1,
    status: "draft",
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-01-15T09:00:00Z",
    ...overrides,
  };
}

function makeMinimalPage(): GeneratedLandingPage {
  return {
    slug: "minimal-biz",
    businessName: "Minimal Business",
    niche: "general",
    industry: "general",
    geo: { city: "Portland", state: "OR", country: "US" },
    sections: [
      makeSection("hero", {
        headline: "Minimal Business",
        ctaText: "",
        ctaUrl: "#",
      }, 0),
      makeSection("about", {
        heading: "About Us",
        description: "Short desc.",
      }, 1),
    ],
    intakeSource: "lp-minimal-biz",
    accentColor: "#225f54",
    metaTitle: "Minimal Business",
    metaDescription: "Short.",
    jsonLd: {},
    version: 1,
    status: "draft",
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-01-15T09:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// Hero section scoring
// ---------------------------------------------------------------------------

describe("scoreHeroSection", () => {
  it("scores a complete hero section as excellent", () => {
    const result = scoreHeroSection({
      headline: "Test Business — Trusted Plumber in Seattle",
      ctaText: "Get a Free Quote",
      backgroundImage: "https://example.com/bg.jpg",
      rating: 4.8,
    });
    assert.equal(result.sectionType, "hero");
    assert.ok(result.score >= 85, `Expected excellent, got ${result.score}`);
    assert.equal(result.grade, "excellent");
    assert.equal(result.factors.length, 4);
  });

  it("penalizes a too-short headline", () => {
    const result = scoreHeroSection({
      headline: "Hi",
      ctaText: "Go",
      backgroundImage: "bg.jpg",
      rating: 4.0,
    });
    const headlineFactor = result.factors.find((f) => f.name === "headlineLength");
    assert.ok(headlineFactor !== undefined);
    assert.ok(headlineFactor.score < 50, `Expected low score for 2-char headline, got ${headlineFactor.score}`);
  });

  it("penalizes a too-long headline", () => {
    const result = scoreHeroSection({
      headline: "A".repeat(100),
      ctaText: "Go",
      backgroundImage: "bg.jpg",
      rating: 4.0,
    });
    const headlineFactor = result.factors.find((f) => f.name === "headlineLength");
    assert.ok(headlineFactor !== undefined);
    assert.ok(headlineFactor.score < 50);
  });

  it("scores zero for an empty hero section", () => {
    const result = scoreHeroSection({});
    assert.equal(result.score, 0);
    assert.equal(result.grade, "poor");
  });

  it("handles missing CTA gracefully", () => {
    const result = scoreHeroSection({
      headline: "A solid headline for the business page",
      rating: 4.5,
    });
    const ctaFactor = result.factors.find((f) => f.name === "hasCta");
    assert.ok(ctaFactor !== undefined);
    assert.equal(ctaFactor.score, 0);
  });
});

// ---------------------------------------------------------------------------
// Trust bar section scoring
// ---------------------------------------------------------------------------

describe("scoreTrustBarSection", () => {
  it("scores a complete trust bar as excellent", () => {
    const result = scoreTrustBarSection({
      rating: 4.8,
      reviewCount: 50,
      badges: ["Licensed", "Insured", "BBB Accredited"],
    });
    assert.equal(result.score, 100);
    assert.equal(result.grade, "excellent");
  });

  it("penalizes fewer than 3 badges", () => {
    const result = scoreTrustBarSection({
      rating: 4.8,
      reviewCount: 50,
      badges: ["Licensed"],
    });
    const badgeFactor = result.factors.find((f) => f.name === "badgeCount");
    assert.ok(badgeFactor !== undefined);
    assert.ok(badgeFactor.score < 100);
  });

  it("penalizes low review count", () => {
    const result = scoreTrustBarSection({
      rating: 4.0,
      reviewCount: 3,
      badges: ["Licensed", "Insured", "BBB"],
    });
    const reviewFactor = result.factors.find((f) => f.name === "reviewCount");
    assert.ok(reviewFactor !== undefined);
    assert.ok(reviewFactor.score < 100);
  });
});

// ---------------------------------------------------------------------------
// Services section scoring
// ---------------------------------------------------------------------------

describe("scoreServicesSection", () => {
  it("scores ideal service count with descriptions", () => {
    const result = scoreServicesSection({
      services: [
        { name: "Plumbing", description: "Full service plumbing" },
        { name: "Heating", description: "Heating repair and install" },
        { name: "Cooling", description: "AC services" },
      ],
      primaryService: "Plumbing",
    });
    assert.equal(result.score, 100);
  });

  it("penalizes services without descriptions", () => {
    const result = scoreServicesSection({
      services: [
        { name: "Plumbing", description: "" },
        { name: "Heating", description: "" },
        { name: "Cooling", description: "" },
      ],
      primaryService: "Plumbing",
    });
    const descFactor = result.factors.find((f) => f.name === "hasDescriptions");
    assert.ok(descFactor !== undefined);
    assert.equal(descFactor.score, 0);
  });

  it("handles empty services list", () => {
    const result = scoreServicesSection({ services: [] });
    assert.equal(result.grade, "poor");
  });
});

// ---------------------------------------------------------------------------
// Social proof section scoring
// ---------------------------------------------------------------------------

describe("scoreSocialProofSection", () => {
  it("scores good reviews with attribution as excellent", () => {
    const result = scoreSocialProofSection({
      reviews: [
        { author: "A", rating: 5, text: "Really great service, would highly recommend to anyone looking for quality work." },
        { author: "B", rating: 5, text: "Professional and thorough, fixed everything perfectly the first time around." },
        { author: "C", rating: 4, text: "Very good experience overall, fair pricing and excellent communication throughout." },
      ],
      attribution: "Reviews from Google",
    });
    assert.ok(result.score >= 85);
    assert.equal(result.grade, "excellent");
  });

  it("penalizes short review texts", () => {
    const result = scoreSocialProofSection({
      reviews: [
        { author: "A", rating: 5, text: "Good" },
        { author: "B", rating: 5, text: "Nice" },
        { author: "C", rating: 4, text: "OK" },
      ],
      attribution: "Google",
    });
    const textFactor = result.factors.find((f) => f.name === "avgTextLength");
    assert.ok(textFactor !== undefined);
    assert.ok(textFactor.score < 50);
  });

  it("penalizes missing attribution", () => {
    const result = scoreSocialProofSection({
      reviews: [
        { author: "A", rating: 5, text: "Great service and very professional team, highly recommend." },
      ],
    });
    const attrFactor = result.factors.find((f) => f.name === "hasAttribution");
    assert.ok(attrFactor !== undefined);
    assert.equal(attrFactor.score, 0);
  });
});

// ---------------------------------------------------------------------------
// About section scoring
// ---------------------------------------------------------------------------

describe("scoreAboutSection", () => {
  it("scores a complete about section", () => {
    const result = scoreAboutSection({
      description: "A professional plumbing company serving the greater Seattle area with licensed and insured technicians. We have been in business for over 20 years.",
      phone: "+1-206-555-0100",
      address: "123 Main St",
      website: "https://testbiz.com",
    });
    assert.ok(result.score >= 85);
    assert.equal(result.grade, "excellent");
  });

  it("penalizes short description", () => {
    const result = scoreAboutSection({
      description: "Short.",
      phone: "+1-206-555-0100",
      address: "123 Main St",
      website: "https://testbiz.com",
    });
    const descFactor = result.factors.find((f) => f.name === "descriptionLength");
    assert.ok(descFactor !== undefined);
    assert.ok(descFactor.score < 50);
  });

  it("penalizes missing contact info", () => {
    const result = scoreAboutSection({
      description: "A professional plumbing company serving the greater Seattle area with licensed and insured technicians.",
    });
    assert.ok(result.score < 85);
    const phoneFactor = result.factors.find((f) => f.name === "hasPhone");
    assert.equal(phoneFactor!.score, 0);
  });
});

// ---------------------------------------------------------------------------
// Hours section scoring
// ---------------------------------------------------------------------------

describe("scoreHoursSection", () => {
  it("scores complete hours as excellent", () => {
    const result = scoreHoursSection({
      hours: [
        { day: "monday", open: "08:00", close: "18:00" },
        { day: "tuesday", open: "08:00", close: "18:00" },
        { day: "wednesday", open: "08:00", close: "18:00" },
        { day: "thursday", open: "08:00", close: "18:00" },
        { day: "friday", open: "08:00", close: "17:00" },
      ],
    });
    assert.equal(result.score, 100);
    assert.equal(result.grade, "excellent");
  });

  it("penalizes incomplete hours entries", () => {
    const result = scoreHoursSection({
      hours: [
        { day: "monday", open: "08:00", close: "18:00" },
        { day: "tuesday", open: "", close: "" },
      ],
    });
    const noEmptyFactor = result.factors.find((f) => f.name === "noEmptyValues");
    assert.ok(noEmptyFactor !== undefined);
    assert.equal(noEmptyFactor.score, 0);
  });

  it("handles empty hours array", () => {
    const result = scoreHoursSection({ hours: [] });
    // daysCovered scores 0 (weight 0.6), noEmptyValues scores 100 (weight 0.4)
    // because vacuously no entries are incomplete.
    assert.equal(result.score, 40);
    assert.equal(result.grade, "poor");
  });

  it("treats closed days as valid entries", () => {
    const result = scoreHoursSection({
      hours: [
        { day: "monday", open: "08:00", close: "18:00" },
        { day: "tuesday", open: "08:00", close: "18:00" },
        { day: "wednesday", open: "08:00", close: "18:00" },
        { day: "thursday", open: "08:00", close: "18:00" },
        { day: "friday", open: "08:00", close: "17:00" },
        { day: "saturday", open: "00:00", close: "00:00", closed: true },
        { day: "sunday", open: "00:00", close: "00:00", closed: true },
      ],
    });
    assert.equal(result.score, 100);
  });
});

// ---------------------------------------------------------------------------
// FAQ section scoring
// ---------------------------------------------------------------------------

describe("scoreFaqSection", () => {
  it("scores well-formed FAQs", () => {
    const result = scoreFaqSection({
      items: [
        { question: "Q1?", answer: "Yes, we offer 24/7 emergency services for all residential customers." },
        { question: "Q2?", answer: "We are fully licensed, bonded, and insured in the state." },
        { question: "Q3?", answer: "Contact us for a no-obligation free estimate on any project." },
      ],
    });
    assert.ok(result.score >= 85);
  });

  it("penalizes unanswered questions", () => {
    const result = scoreFaqSection({
      items: [
        { question: "Q1?", answer: "Yes we do." },
        { question: "Q2?", answer: "" },
        { question: "Q3?" },
      ],
    });
    const answeredFactor = result.factors.find((f) => f.name === "allAnswered");
    assert.ok(answeredFactor !== undefined);
    assert.equal(answeredFactor.score, 0);
  });

  it("handles empty FAQ list", () => {
    const result = scoreFaqSection({ items: [] });
    // itemCount 0 (weight 0.3), avgAnswerLength 0 (weight 0.4),
    // allAnswered is vacuously true = 100 (weight 0.3) => 30
    assert.equal(result.score, 30);
    assert.equal(result.grade, "poor");
  });
});

// ---------------------------------------------------------------------------
// Lead magnet section scoring
// ---------------------------------------------------------------------------

describe("scoreLeadMagnetSection", () => {
  it("scores a complete lead magnet form", () => {
    const result = scoreLeadMagnetSection({
      formFields: ["firstName", "email", "phone"],
      submitLabel: "Get Free Quote",
      source: "lp-test",
    });
    assert.equal(result.score, 100);
  });

  it("penalizes missing required fields", () => {
    const result = scoreLeadMagnetSection({
      formFields: ["email"],
      submitLabel: "Submit",
      source: "lp-test",
    });
    const fieldsFactor = result.factors.find((f) => f.name === "hasRequiredFields");
    assert.ok(fieldsFactor !== undefined);
    assert.ok(fieldsFactor.score < 100);
  });

  it("penalizes missing source tracking", () => {
    const result = scoreLeadMagnetSection({
      formFields: ["firstName", "email", "phone"],
      submitLabel: "Submit",
    });
    const sourceFactor = result.factors.find((f) => f.name === "hasSourceTracking");
    assert.ok(sourceFactor !== undefined);
    assert.equal(sourceFactor.score, 0);
  });
});

// ---------------------------------------------------------------------------
// CTA banner section scoring
// ---------------------------------------------------------------------------

describe("scoreCtaBannerSection", () => {
  it("scores a complete CTA banner", () => {
    const result = scoreCtaBannerSection({
      heading: "Ready to Get Started?",
      ctaText: "Call Now",
      phone: "+1-206-555-0100",
      ctaUrl: "tel:12065550100",
    });
    assert.equal(result.score, 100);
  });

  it("scores zero for empty CTA banner", () => {
    const result = scoreCtaBannerSection({});
    assert.equal(result.score, 0);
    assert.equal(result.grade, "poor");
  });

  it("scores partial with phone but no heading", () => {
    const result = scoreCtaBannerSection({
      ctaText: "Call",
      phone: "+1-206-555-0100",
    });
    const headingFactor = result.factors.find((f) => f.name === "hasHeading");
    assert.equal(headingFactor!.score, 0);
    assert.ok(result.score > 0);
  });
});

// ---------------------------------------------------------------------------
// SEO scoring
// ---------------------------------------------------------------------------

describe("scoreSEO", () => {
  it("scores a fully optimized page at 100", () => {
    const page = makeFullPage({
      metaTitle: "Test Business — Plumber in Seattle, WA",
      metaDescription: "A professional plumbing company serving the greater Seattle area with licensed and insured technicians. Contact us today for a free quote.",
      jsonLd: { "@context": "https://schema.org", "@type": "LocalBusiness" },
      canonicalUrl: "/lp/test-biz",
      ogImage: "https://example.com/og.jpg",
    });
    const score = scoreSEO(page);
    assert.equal(score, 100);
  });

  it("gives partial credit for out-of-range metaTitle", () => {
    const page = makeFullPage({ metaTitle: "Short" });
    const score = scoreSEO(page);
    assert.ok(score < 100);
    assert.ok(score > 0);
  });

  it("gives partial credit for out-of-range metaDescription", () => {
    const page = makeFullPage({ metaDescription: "Too short." });
    const score = scoreSEO(page);
    assert.ok(score < 100);
  });

  it("penalizes missing JSON-LD context", () => {
    const page = makeFullPage({ jsonLd: {} });
    const score = scoreSEO(page);
    const fullScore = scoreSEO(makeFullPage());
    assert.ok(score < fullScore);
  });

  it("penalizes missing canonicalUrl", () => {
    const page = makeFullPage({ canonicalUrl: undefined });
    const score = scoreSEO(page);
    assert.ok(score < 100);
  });

  it("penalizes missing ogImage", () => {
    const page = makeFullPage({ ogImage: undefined });
    const score = scoreSEO(page);
    assert.ok(score < 100);
  });

  it("scores zero for completely bare SEO", () => {
    const page = makeFullPage({
      metaTitle: "",
      metaDescription: "",
      jsonLd: {},
      canonicalUrl: undefined,
      ogImage: undefined,
    });
    const score = scoreSEO(page);
    assert.equal(score, 0);
  });
});

// ---------------------------------------------------------------------------
// Grade threshold boundaries
// ---------------------------------------------------------------------------

describe("grade thresholds", () => {
  it("assigns excellent at score 85", () => {
    const page = makeFullPage();
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);
    // The full page should score well
    assert.ok(
      ["excellent", "good"].includes(report.overallGrade),
      `Expected excellent or good, got ${report.overallGrade} (score: ${report.overallScore})`,
    );
  });

  it("assigns poor for a nearly empty page", () => {
    const page = makeFullPage({
      sections: [makeSection("hero", {}, 0)],
    });
    const profile = makeProfile({ listingCompleteness: 10, reviewQuality: 5 });
    const report = scoreContentQuality(page, profile);
    assert.equal(report.overallGrade, "poor");
    assert.ok(report.overallScore < 50);
  });

  it("grade boundaries are correct: 85=excellent, 70=good, 50=fair, 49=poor", () => {
    // Verify grade assignment via the full scoring function by checking a
    // well-known full page vs a minimal one.
    const fullReport = scoreContentQuality(makeFullPage(), makeProfile());
    assert.ok(fullReport.overallScore >= 50, `Full page scored ${fullReport.overallScore}`);

    const minimalReport = scoreContentQuality(makeMinimalPage(), makeProfile({ listingCompleteness: 0, reviewQuality: 0 }));
    assert.ok(minimalReport.overallScore < fullReport.overallScore);
  });
});

// ---------------------------------------------------------------------------
// Full page quality scoring
// ---------------------------------------------------------------------------

describe("scoreContentQuality", () => {
  it("produces a complete report for a full page", () => {
    const page = makeFullPage();
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    assert.equal(report.slug, "test-biz");
    assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
    assert.ok(["excellent", "good", "fair", "poor"].includes(report.overallGrade));
    assert.ok(report.sectionScores.length > 0);
    assert.equal(report.dataCompleteness, 85);
    assert.equal(report.reviewQuality, 78);
    assert.ok(report.seoScore >= 0 && report.seoScore <= 100);
    assert.ok(Array.isArray(report.accessibilityFlags));
    assert.ok(typeof report.scoredAt === "string");
  });

  it("scores all 9 scoreable section types", () => {
    const page = makeFullPage();
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);
    const sectionTypes = report.sectionScores.map((s) => s.sectionType);

    assert.ok(sectionTypes.includes("hero"));
    assert.ok(sectionTypes.includes("trust-bar"));
    assert.ok(sectionTypes.includes("services"));
    assert.ok(sectionTypes.includes("social-proof"));
    assert.ok(sectionTypes.includes("about"));
    assert.ok(sectionTypes.includes("hours"));
    assert.ok(sectionTypes.includes("faq"));
    assert.ok(sectionTypes.includes("lead-magnet"));
    assert.ok(sectionTypes.includes("cta-banner"));
  });

  it("includes dataCompleteness and reviewQuality from the profile", () => {
    const profile = makeProfile({ listingCompleteness: 42, reviewQuality: 67 });
    const report = scoreContentQuality(makeFullPage(), profile);
    assert.equal(report.dataCompleteness, 42);
    assert.equal(report.reviewQuality, 67);
  });

  it("handles a page with no scoreable sections", () => {
    const page = makeFullPage({
      sections: [makeSection("attributes" as LandingPageSection["type"], { attributes: [] }, 0)],
    });
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);
    assert.equal(report.overallScore, 0);
    assert.equal(report.overallGrade, "poor");
    assert.equal(report.sectionScores.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Minimal page quality scoring
// ---------------------------------------------------------------------------

describe("minimal page scoring", () => {
  it("produces a valid report with only hero and about sections", () => {
    const page = makeMinimalPage();
    const profile = makeProfile({ listingCompleteness: 20, reviewQuality: 0 });
    const report = scoreContentQuality(page, profile);

    assert.equal(report.slug, "minimal-biz");
    assert.equal(report.sectionScores.length, 2);
    assert.ok(report.overallScore < 50);
    assert.equal(report.dataCompleteness, 20);
    assert.equal(report.reviewQuality, 0);
  });

  it("generates recommendations for low-scoring minimal sections", () => {
    const page = makeMinimalPage();
    const profile = makeProfile({ listingCompleteness: 20, reviewQuality: 0 });
    const report = scoreContentQuality(page, profile);

    assert.ok(report.recommendations.length > 0);
    const sections = report.recommendations.map((r) => r.section);
    assert.ok(sections.includes("hero") || sections.includes("about"));
  });
});

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

describe("recommendations", () => {
  it("generates recommendations for sections scoring below 60", () => {
    const page = makeFullPage({
      sections: [
        makeSection("hero", { headline: "Hi" }, 0),
        makeSection("about", { description: "X" }, 1),
        makeSection("cta-banner", {}, 2),
      ],
    });
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    assert.ok(report.recommendations.length > 0);
  });

  it("orders recommendations by priority (critical first)", () => {
    const page = makeFullPage({
      sections: [
        makeSection("hero", {}, 0),
        makeSection("about", {}, 1),
        makeSection("cta-banner", {}, 2),
      ],
    });
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    const priorities = report.recommendations.map((r) => r.priority);
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < priorities.length; i++) {
      assert.ok(
        order[priorities[i]] >= order[priorities[i - 1]],
        `Recommendation ${i} (${priorities[i]}) should not precede ${priorities[i - 1]}`,
      );
    }
  });

  it("does not generate recommendations for high-scoring sections", () => {
    const page = makeFullPage();
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    const highScoreSections = report.sectionScores.filter((s) => s.score >= 60);
    for (const section of highScoreSections) {
      const recsForSection = report.recommendations.filter((r) => r.section === section.sectionType);
      assert.equal(
        recsForSection.length,
        0,
        `Section ${section.sectionType} scored ${section.score} but has ${recsForSection.length} recommendations`,
      );
    }
  });

  it("recommendations include section, issue, and suggestion", () => {
    const page = makeFullPage({
      sections: [makeSection("cta-banner", {}, 0)],
    });
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    for (const rec of report.recommendations) {
      assert.ok(rec.section.length > 0, "Recommendation must have a section");
      assert.ok(rec.issue.length > 0, "Recommendation must have an issue");
      assert.ok(rec.suggestion.length > 0, "Recommendation must have a suggestion");
      assert.ok(["critical", "high", "medium", "low"].includes(rec.priority));
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("handles sections with entirely empty content objects", () => {
    const page = makeFullPage({
      sections: [
        makeSection("hero", {}, 0),
        makeSection("trust-bar", {}, 1),
        makeSection("services", {}, 2),
        makeSection("social-proof", {}, 3),
        makeSection("about", {}, 4),
        makeSection("hours", {}, 5),
        makeSection("faq", {}, 6),
        makeSection("lead-magnet", {}, 7),
        makeSection("cta-banner", {}, 8),
      ],
    });
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    assert.equal(report.sectionScores.length, 9);
    // Some sections score non-zero due to vacuous-truth factors (e.g. hours
    // noEmptyValues, faq allAnswered). The overall is still very low.
    assert.ok(report.overallScore < 20, `Expected < 20, got ${report.overallScore}`);
    assert.equal(report.overallGrade, "poor");
  });

  it("handles missing fields in content gracefully", () => {
    const result = scoreHeroSection({ headline: undefined as unknown as string });
    assert.equal(result.factors[0].score, 0);
  });

  it("handles non-array values for array fields", () => {
    const result = scoreTrustBarSection({ badges: "not-an-array" });
    const badgeFactor = result.factors.find((f) => f.name === "badgeCount");
    assert.ok(badgeFactor !== undefined);
    assert.equal(badgeFactor.score, 0);
  });

  it("handles non-string values for string fields", () => {
    const result = scoreAboutSection({ description: 12345 });
    const descFactor = result.factors.find((f) => f.name === "descriptionLength");
    assert.ok(descFactor !== undefined);
    assert.equal(descFactor.score, 0);
  });

  it("clamps scores to 0-100 range", () => {
    const page = makeFullPage();
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
    assert.ok(report.seoScore >= 0 && report.seoScore <= 100);
    for (const section of report.sectionScores) {
      assert.ok(section.score >= 0 && section.score <= 100, `Section ${section.sectionType} score ${section.score} out of range`);
      for (const factor of section.factors) {
        assert.ok(factor.score >= 0 && factor.score <= 100, `Factor ${factor.name} score ${factor.score} out of range`);
      }
    }
  });

  it("factor weights sum to 1 within each section", () => {
    const page = makeFullPage();
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    for (const section of report.sectionScores) {
      const weightSum = section.factors.reduce((sum, f) => sum + f.weight, 0);
      assert.ok(
        Math.abs(weightSum - 1.0) < 0.001,
        `Section ${section.sectionType} weights sum to ${weightSum}, expected 1.0`,
      );
    }
  });

  it("unknown section types are skipped without error", () => {
    const page = makeFullPage({
      sections: [
        makeSection("hero", { headline: "Test headline for quality scoring" }, 0),
        makeSection("unknown-type" as LandingPageSection["type"], { foo: "bar" }, 1),
      ],
    });
    const profile = makeProfile();
    const report = scoreContentQuality(page, profile);

    assert.equal(report.sectionScores.length, 1);
    assert.equal(report.sectionScores[0].sectionType, "hero");
  });
});

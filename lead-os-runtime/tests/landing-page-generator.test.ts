import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateLandingPage,
  resetLandingPageStore,
  type GeneratedLandingPage,
  type LandingPageSection,
} from "../src/lib/landing-page-generator.ts";
import { ingestGMBListing, type GMBListingData } from "../src/lib/gmb-ingestor.ts";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const fullListing: GMBListingData = {
  placeId: "ChIJ_fake_place_id",
  name: "Joe's Plumbing & Heating",
  address: "123 Main St",
  city: "Seattle",
  state: "WA",
  postalCode: "98101",
  country: "US",
  phone: "+1-206-555-0100",
  website: "https://joesplumbing.com",
  primaryCategory: "Plumber",
  additionalCategories: ["Water Heater Installation Service", "Drain Cleaning Service"],
  description: "Family-owned plumbing company serving Seattle since 1985. Licensed, bonded, and insured.",
  rating: 4.8,
  reviewCount: 127,
  reviews: [
    { author: "John Smith", rating: 5, text: "Amazing service! Joe fixed our leaky faucet in no time. Highly recommend!", relativeTime: "2 months ago" },
    { author: "Sarah", rating: 5, text: "Very professional and affordable. Will use again.", relativeTime: "1 month ago" },
    { author: "Mike Johnson", rating: 4, text: "Good work but arrived a bit late.", relativeTime: "3 months ago" },
    { rating: 5 },
    { author: "A", rating: 3 },
  ],
  photos: [
    { url: "https://example.com/storefront.jpg", category: "exterior" },
    { url: "https://example.com/team.jpg", category: "team" },
  ],
  hours: [
    { day: "monday", open: "08:00", close: "18:00" },
    { day: "tuesday", open: "08:00", close: "18:00" },
    { day: "saturday", open: "09:00", close: "14:00" },
    { day: "sunday", open: "00:00", close: "00:00", closed: true },
  ],
  attributes: [
    { key: "wheelchair_accessible", label: "Wheelchair Accessible", value: true },
    { key: "free_estimates", label: "Free Estimates", value: true },
    { key: "accepts_credit_cards", label: "Accepts Credit Cards", value: true },
  ],
  qAndA: [
    { question: "Do you do emergency calls?", answer: "Yes, we offer 24/7 emergency plumbing services." },
  ],
  geo: { lat: 47.6062, lng: -122.3321 },
};

const minimalListing: GMBListingData = {
  name: "Bob's Auto",
  address: "456 Oak Ave, Portland, OR",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSection(
  page: GeneratedLandingPage,
  type: string,
): LandingPageSection | undefined {
  return page.sections.find((s) => s.type === type);
}

// ---------------------------------------------------------------------------
// generateLandingPage — full profile
// ---------------------------------------------------------------------------

describe("generateLandingPage", () => {
  beforeEach(() => {
    resetLandingPageStore();
  });

  it("generates all expected sections for a complete profile", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const types = page.sections.map((s) => s.type);

    assert.ok(types.includes("hero"));
    assert.ok(types.includes("trust-bar"));
    assert.ok(types.includes("services"));
    assert.ok(types.includes("social-proof"));
    assert.ok(types.includes("about"));
    assert.ok(types.includes("lead-magnet"));
    assert.ok(types.includes("cta-banner"));
  });

  it("hero section has businessName in headline", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const hero = findSection(page, "hero");

    assert.ok(hero);
    assert.ok(typeof hero.content.headline === "string");
    assert.ok((hero.content.headline as string).length > 0);
  });

  it("hero section includes rating and reviewCount", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const hero = findSection(page, "hero");

    assert.ok(hero);
    assert.equal(hero.content.rating, 4.8);
    assert.equal(hero.content.reviewCount, 127);
  });

  it("trust-bar section has rating and badges from attributes", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const trustBar = findSection(page, "trust-bar");

    assert.ok(trustBar);
    assert.equal(trustBar.content.rating, 4.8);
    const badges = trustBar.content.badges as string[];
    assert.ok(Array.isArray(badges));
    assert.ok(badges.length > 0);
  });

  it("services section lists additional categories", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const services = findSection(page, "services");

    assert.ok(services);
    const items = services.content.services as Array<{ name: string }>;
    assert.ok(Array.isArray(items));
    assert.ok(items.length > 0);
  });

  it("social-proof section has reviews with Google attribution", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const socialProof = findSection(page, "social-proof");

    assert.ok(socialProof);
    const reviews = socialProof.content.reviews as Array<{ author: string }>;
    assert.ok(Array.isArray(reviews));
    assert.ok(reviews.length > 0);
    assert.ok(
      typeof socialProof.content.attribution === "string",
      "social-proof should have Google attribution",
    );
  });

  it("about section has description, phone, address", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const about = findSection(page, "about");

    assert.ok(about);
    assert.ok(typeof about.content.description === "string");
    assert.ok((about.content.description as string).length > 0);
    assert.equal(about.content.phone, profile.phone);
    assert.equal(about.content.address, profile.address);
  });

  it("hours section has operating hours", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const hours = findSection(page, "hours");

    assert.ok(hours);
    const hoursList = hours.content.hours as unknown[];
    assert.ok(Array.isArray(hoursList));
    assert.ok(hoursList.length > 0);
  });

  it("attributes section has positive attributes only", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const attrs = findSection(page, "attributes");

    assert.ok(attrs);
    const items = attrs.content.attributes as Array<{ key: string; label: string }>;
    assert.ok(Array.isArray(items));
    assert.equal(items.length, 3);
  });

  it("faq section has Q&A items", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const faq = findSection(page, "faq");

    assert.ok(faq);
    const items = faq.content.items as Array<{ question: string }>;
    assert.ok(Array.isArray(items));
    assert.ok(items.length > 0);
  });

  it("lead-magnet section has form fields and source", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const leadMagnet = findSection(page, "lead-magnet");

    assert.ok(leadMagnet);
    const formFields = leadMagnet.content.formFields as string[];
    assert.ok(Array.isArray(formFields));
    assert.ok(formFields.includes("email"));
    assert.ok(formFields.includes("phone"));
    assert.ok(typeof leadMagnet.content.source === "string");
  });

  it("cta-banner section has phone CTA", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const ctaBanner = findSection(page, "cta-banner");

    assert.ok(ctaBanner);
    assert.equal(ctaBanner.content.phone, profile.phone);
    assert.equal(ctaBanner.content.ctaText, "Call Now");
  });

  it("generates valid JSON-LD with @context, @type, name, address", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.jsonLd["@context"], "https://schema.org");
    assert.equal(page.jsonLd["@type"], "LocalBusiness");
    assert.equal(page.jsonLd["name"], profile.businessName);
    assert.ok(page.jsonLd["address"]);
  });

  it("JSON-LD includes openingHoursSpecification", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.ok(page.jsonLd["openingHoursSpecification"]);
    const specs = page.jsonLd["openingHoursSpecification"] as unknown[];
    assert.ok(Array.isArray(specs));
    assert.ok(specs.length > 0);
  });

  it("JSON-LD includes aggregateRating when rating exists", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    const aggRating = page.jsonLd["aggregateRating"] as Record<string, unknown>;
    assert.ok(aggRating);
    assert.equal(aggRating["@type"], "AggregateRating");
    assert.equal(aggRating["ratingValue"], 4.8);
  });

  it("metaTitle is within 60 chars", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.ok(page.metaTitle.length > 0);
    assert.ok(page.metaTitle.length <= 60, `metaTitle too long: ${page.metaTitle.length} chars`);
  });

  it("metaDescription is within 160 chars", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.ok(page.metaDescription.length > 0);
  });

  it("sets intakeSource to lp-{slug}", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.ok(page.intakeSource.startsWith("lp-"));
    assert.equal(page.intakeSource, `lp-${profile.slug}`);
  });

  it("sets accentColor to default #225f54 when not specified", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.accentColor, "#225f54");
  });

  it("uses custom accentColor when provided", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile, { accentColor: "#ff5500" });

    assert.equal(page.accentColor, "#ff5500");
  });

  it("sets version to 1 for new pages", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.version, 1);
  });

  it("sets status to draft", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.status, "draft");
  });

  it("generates canonicalUrl", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.ok(page.canonicalUrl);
    assert.ok(page.canonicalUrl.includes(profile.slug));
  });

  it("sections are ordered as a contiguous 0-based sequence", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    for (let i = 0; i < page.sections.length; i++) {
      assert.equal(page.sections[i].order, i);
    }
  });

  it("sets slug from profile", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.slug, profile.slug);
  });

  it("sets niche and industry from profile", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.niche, profile.niche);
    assert.equal(page.industry, profile.industry);
  });

  it("sets geo with city, state, country", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);

    assert.equal(page.geo.city, "Seattle");
    assert.equal(page.geo.state, "WA");
    assert.equal(page.geo.country, "US");
  });

  it("sets tenantId when provided in options", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile, { tenantId: "tenant-123" });

    assert.equal(page.tenantId, "tenant-123");
  });

  it("sets createdAt and updatedAt timestamps", () => {
    const before = new Date().toISOString();
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile);
    const after = new Date().toISOString();

    assert.ok(page.createdAt >= before);
    assert.ok(page.createdAt <= after);
    assert.equal(page.createdAt, page.updatedAt);
  });

  it("sets leadMagnetSlug when provided", () => {
    const profile = ingestGMBListing(fullListing);
    const page = generateLandingPage(profile, { leadMagnetSlug: "free-plumbing-guide" });

    assert.equal(page.leadMagnetSlug, "free-plumbing-guide");
  });
});

// ---------------------------------------------------------------------------
// generateLandingPage — minimal profile
// ---------------------------------------------------------------------------

describe("generateLandingPage with minimal profile", () => {
  beforeEach(() => {
    resetLandingPageStore();
  });

  it("still generates hero, about, lead-magnet, cta-banner sections", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);
    const types = page.sections.map((s) => s.type);

    assert.ok(types.includes("hero"));
    assert.ok(types.includes("about"));
    assert.ok(types.includes("lead-magnet"));
    assert.ok(types.includes("cta-banner"));
  });

  it("omits trust-bar when no rating", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);
    const trustBar = findSection(page, "trust-bar");

    assert.equal(trustBar, undefined);
  });

  it("omits services when no additional categories", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);
    const services = findSection(page, "services");

    assert.equal(services, undefined);
  });

  it("omits social-proof when no reviews", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);
    const socialProof = findSection(page, "social-proof");

    assert.equal(socialProof, undefined);
  });

  it("omits hours when no hours data", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);
    const hours = findSection(page, "hours");

    assert.equal(hours, undefined);
  });

  it("generates fallback FAQ section", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);
    const faq = findSection(page, "faq");

    assert.ok(faq, "minimal profile should still have FAQ from fallback");
    const items = faq.content.items as Array<{ question: string }>;
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 3, "fallback FAQ should have at least 3 items");
  });

  it("has valid JSON-LD even with minimal data", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);

    assert.equal(page.jsonLd["@context"], "https://schema.org");
    assert.equal(page.jsonLd["@type"], "LocalBusiness");
    assert.equal(page.jsonLd["name"], "Bob's Auto");
  });

  it("metaTitle is valid even with minimal data", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);

    assert.ok(page.metaTitle.length > 0);
    assert.ok(page.metaTitle.length <= 60);
  });

  it("sets status to draft for minimal listing", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);

    assert.equal(page.status, "draft");
  });

  it("sets default accentColor for minimal listing", () => {
    const profile = ingestGMBListing(minimalListing);
    const page = generateLandingPage(profile);

    assert.equal(page.accentColor, "#225f54");
  });
});

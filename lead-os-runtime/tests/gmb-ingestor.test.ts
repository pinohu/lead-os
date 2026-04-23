import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  generateBusinessSlug,
  detectNicheFromCategories,
  computeListingCompleteness,
  computeReviewQuality,
  selectTopReviews,
  generateFallbackFAQ,
  ingestGMBListing,
  type GMBListingData,
  type GMBReview,
} from "../src/lib/gmb-ingestor.ts";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeGMBListing(overrides: Partial<GMBListingData> = {}): GMBListingData {
  return {
    name: "Springfield Plumbing Co",
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    postalCode: "62701",
    country: "US",
    phone: "555-123-4567",
    primaryCategory: "Plumber",
    ...overrides,
  };
}

function makeReview(overrides: Partial<GMBReview> = {}): GMBReview {
  return {
    author: "John D",
    rating: 5,
    text: "Excellent service! They fixed our pipes quickly and professionally. Would highly recommend to anyone in the area.",
    relativeTime: "2 months ago",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateBusinessSlug
// ---------------------------------------------------------------------------

describe("generateBusinessSlug", () => {
  test("generates slug from normal business name", () => {
    assert.equal(generateBusinessSlug("Springfield Plumbing Co"), "springfield-plumbing-co");
  });

  test("appends city when provided", () => {
    const slug = generateBusinessSlug("Acme Plumbing", "Springfield");
    assert.ok(slug.includes("springfield"), `expected 'springfield' in slug, got: ${slug}`);
  });

  test("handles special characters and spaces", () => {
    assert.equal(
      generateBusinessSlug("Bob's HVAC & Heating -- #1 Choice!!!"),
      "bob-s-hvac-heating-1-choice",
    );
  });

  test("truncates to 50 characters maximum", () => {
    const slug = generateBusinessSlug("A".repeat(60) + " Business");
    assert.ok(slug.length <= 50, `slug length ${slug.length} exceeds 50`);
  });

  test("does not start or end with a hyphen", () => {
    const slug = generateBusinessSlug("---test---");
    assert.ok(!slug.startsWith("-"), "should not start with hyphen");
    assert.ok(!slug.endsWith("-"), "should not end with hyphen");
  });

  test("collapses consecutive hyphens", () => {
    const slug = generateBusinessSlug("A -- B --- C");
    assert.ok(!slug.includes("--"), "should not have consecutive hyphens");
  });

  test("produces slug matching SLUG_PATTERN for normal input", () => {
    const slug = generateBusinessSlug("Joe's Plumbing & Heating");
    assert.match(slug, /^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
  });

  test("handles degenerate empty-ish input without throwing", () => {
    assert.doesNotThrow(() => generateBusinessSlug(""));
    assert.doesNotThrow(() => generateBusinessSlug("!!!"));
  });
});

// ---------------------------------------------------------------------------
// detectNicheFromCategories
// ---------------------------------------------------------------------------

describe("detectNicheFromCategories", () => {
  test("maps Plumber to construction industry", () => {
    const result = detectNicheFromCategories("Plumber");
    assert.equal(result.industry, "construction");
    assert.equal(result.niche, "plumbing");
  });

  test("maps Dentist to health industry", () => {
    const result = detectNicheFromCategories("Dentist");
    assert.equal(result.industry, "health");
  });

  test("maps Lawyer to legal industry", () => {
    const result = detectNicheFromCategories("Lawyer");
    assert.equal(result.industry, "legal");
  });

  test("maps Real Estate Agent to real-estate industry", () => {
    const result = detectNicheFromCategories("Real Estate Agent");
    assert.equal(result.industry, "real-estate");
  });

  test("maps Hair Salon to creative industry", () => {
    const result = detectNicheFromCategories("Hair Salon");
    assert.equal(result.industry, "creative");
  });

  test("is case-insensitive", () => {
    assert.equal(detectNicheFromCategories("PLUMBER").industry, "construction");
    assert.equal(detectNicheFromCategories("dentist").industry, "health");
    assert.equal(detectNicheFromCategories("LaWyEr").industry, "legal");
  });

  test("uses primaryCategory before additionalCategories", () => {
    const result = detectNicheFromCategories("Dentist", ["Plumber"]);
    assert.equal(result.industry, "health");
  });

  test("falls back to additionalCategories when primary is unknown", () => {
    const result = detectNicheFromCategories("Unknown Service", ["Dentist"]);
    assert.equal(result.industry, "health");
  });

  test("falls back to general when nothing matches", () => {
    const result = detectNicheFromCategories("Quantum Widget Maker");
    assert.equal(result.industry, "general");
    assert.equal(result.niche, "general");
  });

  test("handles substring matching", () => {
    const result = detectNicheFromCategories("Emergency Plumber Service");
    assert.equal(result.industry, "construction");
  });
});

// ---------------------------------------------------------------------------
// computeListingCompleteness
// ---------------------------------------------------------------------------

describe("computeListingCompleteness", () => {
  test("returns 100 for a fully populated listing", () => {
    const listing = makeGMBListing({
      website: "https://test.com",
      hours: [{ day: "monday", open: "08:00", close: "17:00", closed: false }],
      photos: [
        { url: "https://p.com/1.jpg" },
        { url: "https://p.com/2.jpg" },
        { url: "https://p.com/3.jpg" },
      ],
      reviewCount: 15,
      reviews: Array.from({ length: 5 }, () => makeReview()),
      description: "A great plumbing company.",
      attributes: [{ key: "licensed", label: "Licensed", value: true }],
    });

    assert.equal(computeListingCompleteness(listing), 100);
  });

  test("returns low score for minimal listing", () => {
    const score = computeListingCompleteness(makeGMBListing({ phone: undefined }));
    assert.ok(score < 50, `expected < 50, got ${score}`);
  });

  test("stays within 0-100 range on empty input", () => {
    const score = computeListingCompleteness({ name: "", address: "" });
    assert.ok(score >= 0 && score <= 100, `out of range: ${score}`);
  });

  test("adding phone increases score", () => {
    const without = computeListingCompleteness(makeGMBListing({ phone: undefined }));
    const withPhone = computeListingCompleteness(makeGMBListing({ phone: "555-000-0000" }));
    assert.ok(withPhone > without, "adding phone should increase completeness");
  });

  test("partial photo count yields partial score", () => {
    const one = computeListingCompleteness(makeGMBListing({ photos: [{ url: "x" }] }));
    const three = computeListingCompleteness(
      makeGMBListing({ photos: [{ url: "x" }, { url: "y" }, { url: "z" }] }),
    );
    assert.ok(three > one, "3 photos should score higher than 1");
  });
});

// ---------------------------------------------------------------------------
// computeReviewQuality
// ---------------------------------------------------------------------------

describe("computeReviewQuality", () => {
  test("returns 0 when no arguments provided", () => {
    assert.equal(computeReviewQuality(), 0);
  });

  test("returns 0 for empty reviews array and no rating", () => {
    assert.equal(computeReviewQuality([]), 0);
  });

  test("returns high score for many detailed 5-star reviews", () => {
    const reviews = Array.from({ length: 60 }, (_, i) =>
      makeReview({ author: `User ${i}`, rating: 5 }),
    );
    const score = computeReviewQuality(reviews, 5, 60);
    assert.ok(score >= 80, `expected >= 80, got ${score}`);
  });

  test("returns low score for poor aggregate rating with few reviews", () => {
    const reviews = [
      makeReview({ rating: 1, text: "Bad" }),
      makeReview({ rating: 2, text: "Poor" }),
    ];
    const score = computeReviewQuality(reviews, 1.5, 2);
    assert.ok(score < 40, `expected < 40, got ${score}`);
  });

  test("long review text yields higher score than short", () => {
    const shortReviews = [makeReview({ text: "OK" })];
    const longReviews = [makeReview({ text: "A".repeat(100) })];
    assert.ok(
      computeReviewQuality(longReviews, 5, 1) >= computeReviewQuality(shortReviews, 5, 1),
      "long text should yield >= score",
    );
  });

  test("score is within 0-100 range", () => {
    const score = computeReviewQuality([makeReview({ rating: 3, text: "Meh" })], 3, 1);
    assert.ok(score >= 0 && score <= 100, `out of range: ${score}`);
  });
});

// ---------------------------------------------------------------------------
// selectTopReviews
// ---------------------------------------------------------------------------

describe("selectTopReviews", () => {
  test("returns at most 5 reviews by default", () => {
    const reviews = Array.from({ length: 10 }, (_, i) =>
      makeReview({ author: `User ${i}`, rating: 5 }),
    );
    assert.equal(selectTopReviews(reviews).length, 5);
  });

  test("respects custom maxCount", () => {
    const reviews = Array.from({ length: 10 }, (_, i) =>
      makeReview({ author: `User ${i}`, rating: 5 }),
    );
    assert.equal(selectTopReviews(reviews, 3).length, 3);
  });

  test("returns empty array for empty input", () => {
    assert.deepEqual(selectTopReviews([]), []);
  });

  test("prioritizes reviews with text over those without", () => {
    const reviews = [
      makeReview({ rating: 5, text: undefined }),
      makeReview({ rating: 4, text: "Has some text" }),
    ];
    const top = selectTopReviews(reviews, 2);
    assert.ok(top[0].text !== undefined, "first result should have text");
  });

  test("sorts by rating when text presence is equal", () => {
    const reviews = [
      makeReview({ author: "A", rating: 3, text: "ok" }),
      makeReview({ author: "B", rating: 5, text: "great" }),
    ];
    const top = selectTopReviews(reviews, 2);
    assert.equal(top[0].rating, 5);
  });

  test("strips author to first name only", () => {
    const top = selectTopReviews([makeReview({ author: "John Smith" })]);
    assert.equal(top[0].author, "John");
  });

  test("preserves initials as-is (2 chars or fewer)", () => {
    const top = selectTopReviews([makeReview({ author: "JD" })]);
    assert.equal(top[0].author, "JD");
  });

  test("truncates review text at 280 characters with ellipsis", () => {
    const top = selectTopReviews([makeReview({ text: "A".repeat(300) })]);
    assert.ok((top[0].text?.length ?? 0) <= 280, "text should be truncated");
    assert.ok(top[0].text?.endsWith("…"), "should end with ellipsis");
  });

  test("passes through text shorter than 280 characters unchanged", () => {
    const text = "A".repeat(100);
    const top = selectTopReviews([makeReview({ text })]);
    assert.equal(top[0].text, text);
  });
});

// ---------------------------------------------------------------------------
// generateFallbackFAQ
// ---------------------------------------------------------------------------

describe("generateFallbackFAQ", () => {
  test("returns 3-5 items for each industry category", () => {
    const industries = [
      "service", "construction", "health", "legal", "real-estate",
      "education", "finance", "creative", "tech", "franchise",
      "staffing", "faith", "general",
    ] as const;

    for (const industry of industries) {
      const faq = generateFallbackFAQ("niche", industry, "Test Business");
      assert.ok(
        faq.length >= 3 && faq.length <= 5,
        `${industry}: expected 3-5 items, got ${faq.length}`,
      );
    }
  });

  test("each item has a non-empty question", () => {
    const faq = generateFallbackFAQ("plumbing", "construction", "Best Plumbers");
    for (const item of faq) {
      assert.ok(item.question.length > 0, "question should not be empty");
    }
  });

  test("answer references the business name", () => {
    const faq = generateFallbackFAQ("plumbing", "construction", "Best Plumbers");
    for (const item of faq) {
      assert.ok(
        item.answer?.includes("Best Plumbers"),
        `answer should mention business name: ${item.answer}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// ingestGMBListing
// ---------------------------------------------------------------------------

describe("ingestGMBListing", () => {
  test("produces valid IngestedBusinessProfile from full listing", () => {
    const listing = makeGMBListing({
      placeId: "ChIJ_fake",
      rating: 4.8,
      reviewCount: 120,
      website: "https://springfield-plumbing.com",
      serviceArea: "Springfield metro area",
      hours: [{ day: "monday", open: "08:00", close: "17:00", closed: false }],
      photos: [{ url: "https://photo.com/1.jpg", category: "exterior" }],
      reviews: [
        makeReview(),
        makeReview({
          author: "Jane",
          rating: 4,
          text: "Very professional and timely service. Highly recommend this team.",
        }),
      ],
      description: "Springfield's trusted plumber since 2005.",
      attributes: [{ key: "licensed", label: "Licensed & Insured", value: true }],
      qAndA: [{ question: "Do you offer emergency service?", answer: "Yes, 24/7." }],
      geo: { lat: 39.7817, lng: -89.6501 },
    });

    const profile = ingestGMBListing(listing);

    assert.equal(profile.businessName, "Springfield Plumbing Co");
    assert.equal(profile.address, "123 Main St");
    assert.equal(profile.city, "Springfield");
    assert.equal(profile.state, "IL");
    assert.equal(profile.postalCode, "62701");
    assert.equal(profile.country, "US");
    assert.equal(profile.placeId, "ChIJ_fake");
    assert.equal(profile.phone, "555-123-4567");
    assert.equal(profile.website, "https://springfield-plumbing.com");
    assert.equal(profile.rating, 4.8);
    assert.equal(profile.reviewCount, 120);
    assert.equal(profile.primaryCategory, "Plumber");
    assert.equal(profile.description, "Springfield's trusted plumber since 2005.");
    assert.equal(profile.industry, "construction");
    assert.equal(profile.niche, "plumbing");
    assert.equal(profile.hours.length, 1);
    assert.equal(profile.photos.length, 1);
    assert.equal(profile.attributes.length, 1);
    assert.equal(profile.faq.length, 1);
    assert.equal(profile.faq[0].question, "Do you offer emergency service?");
    assert.deepEqual(profile.geo, { lat: 39.7817, lng: -89.6501 });
    assert.equal(profile.serviceArea, "Springfield metro area");
    assert.ok(typeof profile.listingCompleteness === "number");
    assert.ok(typeof profile.reviewQuality === "number");
    assert.ok(typeof profile.digitalPresenceGap === "number");
    assert.ok(profile.ingestedAt.length > 0);
  });

  test("handles minimal listing — no optional fields", () => {
    const profile = ingestGMBListing({ name: "Minimal Biz", address: "1 Street" });

    assert.equal(profile.businessName, "Minimal Biz");
    assert.equal(profile.address, "1 Street");
    assert.equal(profile.city, "");
    assert.equal(profile.state, "");
    assert.equal(profile.postalCode, "");
    assert.equal(profile.country, "");
    assert.equal(profile.phone, undefined);
    assert.equal(profile.website, undefined);
    assert.deepEqual(profile.topReviews, []);
    assert.deepEqual(profile.photos, []);
    assert.deepEqual(profile.hours, []);
    assert.deepEqual(profile.attributes, []);
    assert.ok(profile.faq.length >= 3, "should generate fallback FAQ");
  });

  test("throws when name is missing", () => {
    assert.throws(() => ingestGMBListing({ name: "", address: "1 St" }), /non-empty name/);
    assert.throws(() => ingestGMBListing({ name: "   ", address: "1 St" }), /non-empty name/);
  });

  test("throws when address is missing", () => {
    assert.throws(() => ingestGMBListing({ name: "Biz", address: "" }), /non-empty address/);
    assert.throws(() => ingestGMBListing({ name: "Biz", address: "   " }), /non-empty address/);
  });

  test("uses qAndA from listing when present", () => {
    const listing = makeGMBListing({
      qAndA: [{ question: "Custom Q?", answer: "Custom A." }],
    });
    const profile = ingestGMBListing(listing);
    assert.equal(profile.faq.length, 1);
    assert.equal(profile.faq[0].question, "Custom Q?");
  });

  test("generates fallback FAQ when qAndA is absent", () => {
    const profile = ingestGMBListing(makeGMBListing({ qAndA: undefined }));
    assert.ok(profile.faq.length >= 3, "fallback FAQ should have >= 3 items");
  });

  test("generates fallback description when none provided", () => {
    const profile = ingestGMBListing(makeGMBListing({ description: undefined }));
    assert.ok(profile.description.length > 0);
    assert.ok(profile.description.includes("Springfield Plumbing Co"));
  });

  test("generates a valid slug", () => {
    const profile = ingestGMBListing(makeGMBListing());
    assert.match(profile.slug, /^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    assert.ok(profile.slug.length <= 50);
  });

  test("digital presence gap is higher when no website", () => {
    const withoutWebsite = ingestGMBListing(
      makeGMBListing({
        website: undefined,
        reviewCount: 30,
        reviews: Array.from({ length: 10 }, (_, i) => makeReview({ author: `U${i}` })),
      }),
    );
    const withWebsite = ingestGMBListing(
      makeGMBListing({
        website: "https://example.com",
        reviewCount: 30,
        reviews: Array.from({ length: 10 }, (_, i) => makeReview({ author: `U${i}` })),
      }),
    );
    assert.ok(
      withoutWebsite.digitalPresenceGap >= withWebsite.digitalPresenceGap,
      `no-website (${withoutWebsite.digitalPresenceGap}) should be >= with-website (${withWebsite.digitalPresenceGap})`,
    );
  });

  test("listingCompleteness, reviewQuality, digitalPresenceGap are in 0-100 range", () => {
    const profile = ingestGMBListing(makeGMBListing());
    assert.ok(profile.listingCompleteness >= 0 && profile.listingCompleteness <= 100);
    assert.ok(profile.reviewQuality >= 0 && profile.reviewQuality <= 100);
    assert.ok(profile.digitalPresenceGap >= 0 && profile.digitalPresenceGap <= 100);
  });

  test("top reviews respect maxCount of 5", () => {
    const listing = makeGMBListing({
      reviews: Array.from({ length: 10 }, (_, i) => makeReview({ author: `U${i}` })),
    });
    const profile = ingestGMBListing(listing);
    assert.ok(profile.topReviews.length <= 5);
  });

  test("preserves business hours with typed day field", () => {
    const hours = [
      { day: "monday" as const, open: "08:00", close: "17:00", closed: false },
      { day: "sunday" as const, open: "00:00", close: "00:00", closed: true },
    ];
    const profile = ingestGMBListing(makeGMBListing({ hours }));
    assert.equal(profile.hours.length, 2);
    assert.equal(profile.hours[0].day, "monday");
    assert.equal(profile.hours[1].closed, true);
  });

  test("preserves photos with category and dimension fields", () => {
    const photos = [
      { url: "https://img.com/cover.jpg", category: "cover" as const },
      { url: "https://img.com/team.jpg", category: "team" as const, width: 800, height: 600 },
    ];
    const profile = ingestGMBListing(makeGMBListing({ photos }));
    assert.equal(profile.photos.length, 2);
    assert.equal(profile.photos[0].category, "cover");
    assert.equal(profile.photos[1].width, 800);
  });

  test("top reviews have author privacy sanitization applied", () => {
    const listing = makeGMBListing({
      reviews: [makeReview({ author: "Alice Smith" })],
    });
    const profile = ingestGMBListing(listing);
    for (const review of profile.topReviews) {
      if (review.author && review.author.length > 2) {
        assert.ok(!review.author.includes(" "), `last name should be stripped: ${review.author}`);
      }
    }
  });
});

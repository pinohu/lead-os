import test from "node:test";
import assert from "node:assert/strict";
import {
  recordReview,
  getReviewSummary,
  generateTestimonialSnippet,
  generateStarRating,
  generateGuarantee,
  getGuaranteeTemplates,
  recordSocialProofEvent,
  generateSocialProof,
  getSocialProofConfig,
  calculateTrustScore,
  getTrustRecommendations,
  addCertification,
  generateTrustBadges,
  getTrustBadgeConfig,
  setTenantMeta,
  _resetStores,
  type Review,
} from "../src/lib/trust-engine.ts";

test.beforeEach(() => {
  _resetStores();
});

// ---------------------------------------------------------------------------
// Review Recording & Summary
// ---------------------------------------------------------------------------

test("recordReview stores a review with generated id", async () => {
  const review = await recordReview("t1", {
    rating: 5,
    text: "Excellent service, very professional and reliable",
    source: "google",
    reviewerName: "Jane Smith",
    date: "2026-01-15",
    verified: true,
  });

  assert.ok(review.id.startsWith("rev_"));
  assert.equal(review.tenantId, "t1");
  assert.equal(review.rating, 5);
  assert.equal(review.verified, true);
});

test("getReviewSummary returns correct aggregation", async () => {
  await recordReview("t1", { rating: 5, text: "Great", source: "google", reviewerName: "A", date: "2026-01-01", verified: true });
  await recordReview("t1", { rating: 4, text: "Good", source: "yelp", reviewerName: "B", date: "2026-01-02", verified: true });
  await recordReview("t1", { rating: 2, text: "Bad", source: "internal", reviewerName: "C", date: "2026-01-03", verified: false });

  const summary = getReviewSummary("t1");
  assert.equal(summary.totalCount, 3);
  assert.ok(summary.avgRating > 3);
  assert.ok(summary.avgRating < 5);
  assert.equal(summary.ratingDistribution[5], 1);
  assert.equal(summary.ratingDistribution[4], 1);
  assert.equal(summary.ratingDistribution[2], 1);
  assert.equal(summary.sentimentBreakdown.positive, 2);
  assert.equal(summary.sentimentBreakdown.negative, 1);
  assert.equal(summary.sentimentBreakdown.neutral, 0);
});

test("getReviewSummary returns zeros for unknown tenant", () => {
  const summary = getReviewSummary("unknown");
  assert.equal(summary.totalCount, 0);
  assert.equal(summary.avgRating, 0);
});

// ---------------------------------------------------------------------------
// Testimonial Selection
// ---------------------------------------------------------------------------

test("generateTestimonialSnippet selects best review for target emotion", async () => {
  const reviews: Review[] = [
    { id: "r1", tenantId: "t1", rating: 5, text: "Very trustworthy and reliable company", source: "google", reviewerName: "A", date: "2026-01-01", verified: true },
    { id: "r2", tenantId: "t1", rating: 5, text: "Fast and quick service, same day response", source: "yelp", reviewerName: "B", date: "2026-01-02", verified: true },
    { id: "r3", tenantId: "t1", rating: 5, text: "Outstanding quality work, the best in town", source: "google", reviewerName: "C", date: "2026-01-03", verified: false },
  ];

  const trustMatch = generateTestimonialSnippet(reviews, "trust");
  assert.ok(trustMatch);
  assert.ok(trustMatch.text.includes("trust") || trustMatch.text.includes("reliable"));

  const urgencyMatch = generateTestimonialSnippet(reviews, "urgency");
  assert.ok(urgencyMatch);
  assert.ok(urgencyMatch.text.includes("Fast") || urgencyMatch.text.includes("quick"));

  const qualityMatch = generateTestimonialSnippet(reviews, "quality");
  assert.ok(qualityMatch);
  assert.ok(qualityMatch.text.includes("quality") || qualityMatch.text.includes("Outstanding"));
});

test("generateTestimonialSnippet returns null for empty array", () => {
  const result = generateTestimonialSnippet([], "trust");
  assert.equal(result, null);
});

test("generateTestimonialSnippet prefers verified reviews", () => {
  const reviews: Review[] = [
    { id: "r1", tenantId: "t1", rating: 5, text: "Reliable and transparent company", source: "google", reviewerName: "A", date: "2026-01-01", verified: false },
    { id: "r2", tenantId: "t1", rating: 5, text: "Reliable and transparent company", source: "google", reviewerName: "B", date: "2026-01-02", verified: true },
  ];

  const result = generateTestimonialSnippet(reviews, "trust");
  assert.ok(result);
  assert.equal(result.verified, true);
});

// ---------------------------------------------------------------------------
// Star Rating HTML
// ---------------------------------------------------------------------------

test("generateStarRating produces schema.org markup", () => {
  const html = generateStarRating(4.5, 127);
  assert.ok(html.includes("schema.org/AggregateRating"));
  assert.ok(html.includes('content="4.5"'));
  assert.ok(html.includes('content="127"'));
  assert.ok(html.includes("127 reviews"));
});

test("generateStarRating handles edge case of 0 rating", () => {
  const html = generateStarRating(0, 0);
  assert.ok(html.includes('content="0"'));
  assert.ok(html.includes("0 reviews"));
});

// ---------------------------------------------------------------------------
// Guarantee System
// ---------------------------------------------------------------------------

test("generateGuarantee returns niche-specific guarantee", () => {
  const guarantee = generateGuarantee("construction", "satisfaction");
  assert.equal(guarantee.type, "satisfaction");
  assert.ok(guarantee.title.toLowerCase().includes("workmanship"));
  assert.equal(guarantee.niche, "construction");
});

test("generateGuarantee falls back to default for unknown niche", () => {
  const guarantee = generateGuarantee("basket-weaving", "money-back");
  assert.equal(guarantee.type, "money-back");
  assert.ok(guarantee.description.length > 0);
});

test("getGuaranteeTemplates returns multiple templates per niche", () => {
  const templates = getGuaranteeTemplates("legal");
  assert.ok(templates.length >= 2);
  assert.ok(templates.some((t) => t.type === "money-back"));
});

test("getGuaranteeTemplates returns defaults for unknown niche", () => {
  const templates = getGuaranteeTemplates("astrology");
  assert.ok(templates.length >= 2);
});

// ---------------------------------------------------------------------------
// Social Proof
// ---------------------------------------------------------------------------

test("recordSocialProofEvent stores event with timestamp", () => {
  const event = recordSocialProofEvent("t1", {
    eventType: "booking",
    customerName: "John",
    location: "Austin, TX",
    action: "booked a consultation",
  });

  assert.ok(event.id.startsWith("spe_"));
  assert.equal(event.tenantId, "t1");
  assert.ok(event.timestamp.length > 0);
});

test("generateSocialProof counter returns customer count", () => {
  recordSocialProofEvent("t1", { eventType: "booking", customerName: "A", location: "TX", action: "booked" });
  recordSocialProofEvent("t1", { eventType: "booking", customerName: "B", location: "CA", action: "booked" });

  const proof = generateSocialProof("t1", "counter");
  assert.equal(proof.type, "counter");
  assert.equal(proof.value, 2);
  assert.ok(proof.message.includes("2"));
  assert.ok(proof.html.includes("aria-live"));
});

test("generateSocialProof recent-activity shows latest event", () => {
  recordSocialProofEvent("t1", { eventType: "booking", customerName: "Sarah", location: "Denver", action: "booked a cleaning" });

  const proof = generateSocialProof("t1", "recent-activity");
  assert.equal(proof.type, "recent-activity");
  assert.ok(proof.message.includes("Sarah"));
  assert.ok(proof.message.includes("Denver"));
});

test("generateSocialProof recommendation calculates percentage", async () => {
  await recordReview("t1", { rating: 5, text: "Great", source: "google", reviewerName: "A", date: "2026-01-01", verified: true });
  await recordReview("t1", { rating: 5, text: "Awesome", source: "google", reviewerName: "B", date: "2026-01-02", verified: true });
  await recordReview("t1", { rating: 1, text: "Terrible", source: "google", reviewerName: "C", date: "2026-01-03", verified: true });

  const proof = generateSocialProof("t1", "recommendation");
  assert.equal(proof.type, "recommendation");
  assert.equal(proof.value, 67);
});

test("getSocialProofConfig returns niche-specific config", () => {
  const config = getSocialProofConfig("hvac");
  assert.ok(config.bestTypes.length > 0);
  assert.ok(config.emphasis.length > 0);
});

// ---------------------------------------------------------------------------
// Trust Score
// ---------------------------------------------------------------------------

test("calculateTrustScore returns a score between 0 and 100", async () => {
  await recordReview("t1", { rating: 5, text: "Excellent", source: "google", reviewerName: "A", date: "2026-01-01", verified: true });
  await addCertification("t1", { type: "bbb", name: "BBB A+", issuedBy: "BBB", validUntil: "2027-01-01", verificationUrl: "https://bbb.org" });

  const score = calculateTrustScore("t1");
  assert.ok(score.score >= 0 && score.score <= 100);
  assert.ok(score.components.reviewScore > 0);
  assert.ok(score.components.certificationScore > 0);
  assert.ok(score.calculatedAt.length > 0);
});

test("calculateTrustScore increases with more trust signals", async () => {
  const bare = calculateTrustScore("t1");

  await recordReview("t1", { rating: 5, text: "Amazing", source: "google", reviewerName: "A", date: "2026-01-01", verified: true });
  await addCertification("t1", { type: "license", name: "State License", issuedBy: "State", validUntil: "2027-01-01", verificationUrl: "" });
  setTenantMeta("t1", { yearsInBusiness: 10, avgResponseTimeHours: 1 });

  const loaded = calculateTrustScore("t1");
  assert.ok(loaded.score > bare.score, `Expected ${loaded.score} > ${bare.score}`);
});

test("getTrustRecommendations returns actionable suggestions", () => {
  const recommendations = getTrustRecommendations("new-tenant");
  assert.ok(recommendations.length > 0);
  assert.ok(recommendations.every((r) => r.recommendation.length > 0));
  assert.ok(recommendations.every((r) => r.expectedImpact > 0));
});

// ---------------------------------------------------------------------------
// Certification & Badge System
// ---------------------------------------------------------------------------

test("addCertification stores cert with generated id", async () => {
  const cert = await addCertification("t1", {
    type: "insurance",
    name: "General Liability",
    issuedBy: "State Farm",
    validUntil: "2027-06-30",
    verificationUrl: "https://example.com/verify",
  });

  assert.ok(cert.id.startsWith("cert_"));
  assert.equal(cert.tenantId, "t1");
  assert.equal(cert.type, "insurance");
});

test("generateTrustBadges returns badges for tenant with reviews and certs", async () => {
  for (let i = 0; i < 12; i++) {
    await recordReview("t1", { rating: 5, text: "Great work", source: "google", reviewerName: `User${i}`, date: "2026-01-01", verified: true });
  }
  await addCertification("t1", { type: "bbb", name: "BBB Accredited", issuedBy: "BBB", validUntil: "2027-01-01", verificationUrl: "" });
  await addCertification("t1", { type: "license", name: "Licensed Contractor", issuedBy: "State Board", validUntil: "2027-01-01", verificationUrl: "" });

  const badges = generateTrustBadges("t1");
  assert.ok(badges.length >= 3, `Expected at least 3 badges, got ${badges.length}`);
  assert.ok(badges.some((b) => b.type === "top-rated"));
  assert.ok(badges.some((b) => b.type === "verified-reviews"));
  assert.ok(badges.some((b) => b.type === "bbb"));
  assert.ok(badges.every((b) => b.html.includes("aria-label")));
});

test("generateTrustBadges returns empty for tenant with no data", () => {
  const badges = generateTrustBadges("empty-tenant");
  assert.equal(badges.length, 0);
});

test("getTrustBadgeConfig returns niche-specific priority badges", () => {
  const config = getTrustBadgeConfig("construction");
  assert.ok(config.priorityBadges.includes("license"));
  assert.ok(config.priorityBadges.includes("insurance"));
  assert.ok(config.reason.length > 0);
});

test("getTrustBadgeConfig returns defaults for unknown niche", () => {
  const config = getTrustBadgeConfig("unknown-niche");
  assert.ok(config.priorityBadges.length > 0);
});

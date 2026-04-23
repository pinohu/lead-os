import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveMGRConfig,
  isMGRDryRun,
  sendReviewRequest,
  sendBulkReviewRequests,
  getReviewRequest,
  listReviewRequests,
  addReview,
  listReviews,
  respondToReview,
  createTemplate,
  listTemplates,
  createWidget,
  listWidgets,
  generateWidgetHtml,
  getReviewStats,
  syncReviewsToLandingPage,
  mgrResult,
  resetMGRStore,
} from "../src/lib/integrations/moregoodreviews-adapter.ts";
import type {
  Review,
  ReviewRequest,
  ReviewTemplate,
  ReviewWidget,
  ReviewStats,
  SendReviewRequestInput,
} from "../src/lib/integrations/moregoodreviews-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanup() {
  resetMGRStore();
  delete process.env.MORE_GOOD_REVIEWS_API_KEY;
  delete process.env.MORE_GOOD_REVIEWS_BASE_URL;
}

function sampleInput(overrides?: Partial<SendReviewRequestInput>): SendReviewRequestInput {
  return {
    customerEmail: "jane@example.com",
    customerName: "Jane Doe",
    businessName: "Acme Plumbing",
    ...overrides,
  };
}

function sampleReview(overrides?: Partial<Omit<Review, "id">>): Omit<Review, "id"> {
  return {
    platform: "google",
    author: "John Smith",
    rating: 5,
    text: "Great service!",
    date: "2026-03-01",
    verified: true,
    responded: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

test("resolveMGRConfig returns null when API key is missing", () => {
  cleanup();
  const cfg = resolveMGRConfig();
  assert.equal(cfg, null);
});

test("resolveMGRConfig returns config when API key is set", () => {
  cleanup();
  process.env.MORE_GOOD_REVIEWS_API_KEY = "test-key-123";
  const cfg = resolveMGRConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key-123");
  assert.equal(cfg.baseUrl, "https://api.moregoodreviews.com/v1");
  cleanup();
});

test("resolveMGRConfig uses custom base URL when provided", () => {
  cleanup();
  process.env.MORE_GOOD_REVIEWS_API_KEY = "key";
  process.env.MORE_GOOD_REVIEWS_BASE_URL = "https://custom.api.com/v2";
  const cfg = resolveMGRConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.api.com/v2");
  cleanup();
});

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------

test("isMGRDryRun returns true when no API key", () => {
  cleanup();
  assert.equal(isMGRDryRun(), true);
});

test("isMGRDryRun returns false when API key is set", () => {
  cleanup();
  process.env.MORE_GOOD_REVIEWS_API_KEY = "key";
  assert.equal(isMGRDryRun(), false);
  cleanup();
});

// ---------------------------------------------------------------------------
// Send Review Request (single)
// ---------------------------------------------------------------------------

test("sendReviewRequest creates a request in dry-run mode", async () => {
  cleanup();
  const req = await sendReviewRequest(sampleInput());
  assert.ok(req.id.startsWith("rreq_"));
  assert.equal(req.customerEmail, "jane@example.com");
  assert.equal(req.customerName, "Jane Doe");
  assert.equal(req.businessName, "Acme Plumbing");
  assert.equal(req.status, "sent");
  assert.ok(req.sentAt);
  assert.ok(req.createdAt);
  cleanup();
});

test("sendReviewRequest preserves tenantId", async () => {
  cleanup();
  const req = await sendReviewRequest(sampleInput({ tenantId: "t-100" }));
  assert.equal(req.tenantId, "t-100");
  cleanup();
});

test("sendReviewRequest preserves templateId", async () => {
  cleanup();
  const req = await sendReviewRequest(sampleInput({ templateId: "tmpl-abc" }));
  assert.equal(req.templateId, "tmpl-abc");
  cleanup();
});

test("sendReviewRequest stores the request for later retrieval", async () => {
  cleanup();
  const req = await sendReviewRequest(sampleInput());
  const retrieved = await getReviewRequest(req.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, req.id);
  cleanup();
});

// ---------------------------------------------------------------------------
// Send Bulk Review Requests
// ---------------------------------------------------------------------------

test("sendBulkReviewRequests creates multiple requests", async () => {
  cleanup();
  const inputs = [
    sampleInput({ customerEmail: "a@test.com", customerName: "Alice" }),
    sampleInput({ customerEmail: "b@test.com", customerName: "Bob" }),
    sampleInput({ customerEmail: "c@test.com", customerName: "Carol" }),
  ];
  const results = await sendBulkReviewRequests(inputs);
  assert.equal(results.length, 3);
  assert.equal(results[0].customerName, "Alice");
  assert.equal(results[1].customerName, "Bob");
  assert.equal(results[2].customerName, "Carol");
  cleanup();
});

test("sendBulkReviewRequests assigns unique IDs to each request", async () => {
  cleanup();
  const inputs = [
    sampleInput({ customerEmail: "x@test.com" }),
    sampleInput({ customerEmail: "y@test.com" }),
  ];
  const results = await sendBulkReviewRequests(inputs);
  assert.notEqual(results[0].id, results[1].id);
  cleanup();
});

// ---------------------------------------------------------------------------
// Get / List Review Requests
// ---------------------------------------------------------------------------

test("getReviewRequest returns null for non-existent ID", async () => {
  cleanup();
  const result = await getReviewRequest("nonexistent");
  assert.equal(result, null);
  cleanup();
});

test("listReviewRequests returns all requests without filter", async () => {
  cleanup();
  await sendReviewRequest(sampleInput({ tenantId: "t-1" }));
  await sendReviewRequest(sampleInput({ tenantId: "t-2" }));
  const all = await listReviewRequests();
  assert.equal(all.length, 2);
  cleanup();
});

test("listReviewRequests filters by tenantId", async () => {
  cleanup();
  await sendReviewRequest(sampleInput({ tenantId: "t-1" }));
  await sendReviewRequest(sampleInput({ tenantId: "t-2" }));
  await sendReviewRequest(sampleInput({ tenantId: "t-1" }));
  const filtered = await listReviewRequests("t-1");
  assert.equal(filtered.length, 2);
  cleanup();
});

// ---------------------------------------------------------------------------
// Add Review
// ---------------------------------------------------------------------------

test("addReview creates a review with generated ID", async () => {
  cleanup();
  const review = await addReview(sampleReview());
  assert.ok(review.id.startsWith("rev_"));
  assert.equal(review.author, "John Smith");
  assert.equal(review.rating, 5);
  assert.equal(review.platform, "google");
  cleanup();
});

test("addReview preserves all fields", async () => {
  cleanup();
  const review = await addReview(
    sampleReview({
      platform: "yelp",
      verified: false,
      responded: true,
      response: "Thank you!",
      businessId: "biz-1",
      tenantId: "t-5",
    }),
  );
  assert.equal(review.platform, "yelp");
  assert.equal(review.verified, false);
  assert.equal(review.responded, true);
  assert.equal(review.response, "Thank you!");
  assert.equal(review.businessId, "biz-1");
  assert.equal(review.tenantId, "t-5");
  cleanup();
});

// ---------------------------------------------------------------------------
// List Reviews (with filters)
// ---------------------------------------------------------------------------

test("listReviews returns all reviews without filter", async () => {
  cleanup();
  await addReview(sampleReview());
  await addReview(sampleReview({ platform: "yelp" }));
  const all = await listReviews();
  assert.equal(all.length, 2);
  cleanup();
});

test("listReviews filters by platform", async () => {
  cleanup();
  await addReview(sampleReview({ platform: "google" }));
  await addReview(sampleReview({ platform: "yelp" }));
  await addReview(sampleReview({ platform: "google" }));
  const googleOnly = await listReviews({ platform: "google" });
  assert.equal(googleOnly.length, 2);
  cleanup();
});

test("listReviews filters by minRating", async () => {
  cleanup();
  await addReview(sampleReview({ rating: 2 }));
  await addReview(sampleReview({ rating: 4 }));
  await addReview(sampleReview({ rating: 5 }));
  const highRated = await listReviews({ minRating: 4 });
  assert.equal(highRated.length, 2);
  cleanup();
});

test("listReviews filters by tenantId", async () => {
  cleanup();
  await addReview(sampleReview({ tenantId: "t-a" }));
  await addReview(sampleReview({ tenantId: "t-b" }));
  const filtered = await listReviews({ tenantId: "t-a" });
  assert.equal(filtered.length, 1);
  cleanup();
});

test("listReviews combines multiple filters", async () => {
  cleanup();
  await addReview(sampleReview({ platform: "google", rating: 5, tenantId: "t-1" }));
  await addReview(sampleReview({ platform: "google", rating: 2, tenantId: "t-1" }));
  await addReview(sampleReview({ platform: "yelp", rating: 5, tenantId: "t-1" }));
  await addReview(sampleReview({ platform: "google", rating: 5, tenantId: "t-2" }));
  const results = await listReviews({ platform: "google", minRating: 4, tenantId: "t-1" });
  assert.equal(results.length, 1);
  cleanup();
});

// ---------------------------------------------------------------------------
// Respond to Review
// ---------------------------------------------------------------------------

test("respondToReview marks review as responded with response text", async () => {
  cleanup();
  const review = await addReview(sampleReview());
  assert.equal(review.responded, false);
  const updated = await respondToReview(review.id, "Thank you for your feedback!");
  assert.ok(updated);
  assert.equal(updated.responded, true);
  assert.equal(updated.response, "Thank you for your feedback!");
  cleanup();
});

test("respondToReview returns null for non-existent review", async () => {
  cleanup();
  const result = await respondToReview("fake-id", "response text");
  assert.equal(result, null);
  cleanup();
});

test("respondToReview updates persisted review in store", async () => {
  cleanup();
  const review = await addReview(sampleReview());
  await respondToReview(review.id, "Thanks!");
  const listed = await listReviews();
  const found = listed.find((r) => r.id === review.id);
  assert.ok(found);
  assert.equal(found.responded, true);
  assert.equal(found.response, "Thanks!");
  cleanup();
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

test("createTemplate creates a template with generated ID", async () => {
  cleanup();
  const tmpl = await createTemplate({
    name: "Default",
    subject: "How was your experience?",
    body: "Please leave us a review!",
    followUpDays: 3,
    tenantId: "t-1",
  });
  assert.ok(tmpl.id.startsWith("tmpl_"));
  assert.equal(tmpl.name, "Default");
  assert.equal(tmpl.followUpDays, 3);
  cleanup();
});

test("listTemplates returns all templates", async () => {
  cleanup();
  await createTemplate({ name: "A", subject: "S", body: "B", followUpDays: 1 });
  await createTemplate({ name: "B", subject: "S", body: "B", followUpDays: 2 });
  const all = await listTemplates();
  assert.equal(all.length, 2);
  cleanup();
});

test("listTemplates filters by tenantId", async () => {
  cleanup();
  await createTemplate({ name: "A", subject: "S", body: "B", followUpDays: 1, tenantId: "t-1" });
  await createTemplate({ name: "B", subject: "S", body: "B", followUpDays: 2, tenantId: "t-2" });
  const filtered = await listTemplates("t-1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "A");
  cleanup();
});

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

test("createWidget creates a widget with generated ID", async () => {
  cleanup();
  const widget = await createWidget({
    businessName: "Acme",
    platform: "google",
    style: "carousel",
    minRating: 4,
    maxDisplay: 5,
  });
  assert.ok(widget.id.startsWith("wgt_"));
  assert.equal(widget.businessName, "Acme");
  assert.equal(widget.style, "carousel");
  cleanup();
});

test("listWidgets returns all widgets", async () => {
  cleanup();
  await createWidget({ businessName: "A", platform: "google", style: "grid", minRating: 3, maxDisplay: 10 });
  await createWidget({ businessName: "B", platform: "yelp", style: "list", minRating: 4, maxDisplay: 5 });
  const all = await listWidgets();
  assert.equal(all.length, 2);
  cleanup();
});

// ---------------------------------------------------------------------------
// Widget HTML Generation
// ---------------------------------------------------------------------------

test("generateWidgetHtml returns null for non-existent widget", async () => {
  cleanup();
  const html = await generateWidgetHtml("nonexistent");
  assert.equal(html, null);
  cleanup();
});

test("generateWidgetHtml generates HTML with review content", async () => {
  cleanup();
  await addReview(sampleReview({ rating: 5, author: "Alice", text: "Amazing!" }));
  await addReview(sampleReview({ rating: 4, author: "Bob", text: "Good stuff" }));
  await addReview(sampleReview({ rating: 2, author: "Eve", text: "Meh" }));

  const widget = await createWidget({
    businessName: "Acme",
    platform: "google",
    style: "carousel",
    minRating: 4,
    maxDisplay: 10,
  });

  const html = await generateWidgetHtml(widget.id);
  assert.ok(html);
  assert.ok(html.includes("Alice"));
  assert.ok(html.includes("Amazing!"));
  assert.ok(html.includes("Bob"));
  assert.ok(html.includes("Good stuff"));
  assert.ok(!html.includes("Eve"));
  assert.ok(html.includes("mgr-carousel"));
  assert.ok(html.includes("Acme"));
  cleanup();
});

test("generateWidgetHtml shows empty state when no reviews match", async () => {
  cleanup();
  const widget = await createWidget({
    businessName: "Empty Biz",
    platform: "google",
    style: "list",
    minRating: 5,
    maxDisplay: 10,
  });
  const html = await generateWidgetHtml(widget.id);
  assert.ok(html);
  assert.ok(html.includes("No reviews yet."));
  cleanup();
});

test("generateWidgetHtml respects maxDisplay limit", async () => {
  cleanup();
  for (let i = 0; i < 10; i++) {
    await addReview(sampleReview({ author: `User${i}`, rating: 5 }));
  }
  const widget = await createWidget({
    businessName: "Biz",
    platform: "google",
    style: "grid",
    minRating: 1,
    maxDisplay: 3,
  });
  const html = await generateWidgetHtml(widget.id);
  assert.ok(html);
  const reviewDivCount = (html.match(/class="mgr-review"/g) ?? []).length;
  assert.equal(reviewDivCount, 3);
  cleanup();
});

test("generateWidgetHtml escapes HTML in review content", async () => {
  cleanup();
  await addReview(sampleReview({ author: '<script>alert("xss")</script>', rating: 5 }));
  const widget = await createWidget({
    businessName: "Safe Biz",
    platform: "google",
    style: "list",
    minRating: 1,
    maxDisplay: 10,
  });
  const html = await generateWidgetHtml(widget.id);
  assert.ok(html);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  cleanup();
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getReviewStats returns zeros for empty store", async () => {
  cleanup();
  const stats = await getReviewStats();
  assert.equal(stats.totalReviews, 0);
  assert.equal(stats.avgRating, 0);
  assert.equal(stats.responseRate, 0);
  assert.equal(stats.requestsSent, 0);
  assert.equal(stats.requestConversionRate, 0);
  cleanup();
});

test("getReviewStats computes average rating correctly", async () => {
  cleanup();
  await addReview(sampleReview({ rating: 5 }));
  await addReview(sampleReview({ rating: 3 }));
  await addReview(sampleReview({ rating: 4 }));
  const stats = await getReviewStats();
  assert.equal(stats.totalReviews, 3);
  assert.equal(stats.avgRating, 4);
  cleanup();
});

test("getReviewStats computes rating distribution", async () => {
  cleanup();
  await addReview(sampleReview({ rating: 5 }));
  await addReview(sampleReview({ rating: 5 }));
  await addReview(sampleReview({ rating: 3 }));
  await addReview(sampleReview({ rating: 1 }));
  const stats = await getReviewStats();
  assert.equal(stats.ratingDistribution[5], 2);
  assert.equal(stats.ratingDistribution[3], 1);
  assert.equal(stats.ratingDistribution[1], 1);
  assert.equal(stats.ratingDistribution[2], 0);
  assert.equal(stats.ratingDistribution[4], 0);
  cleanup();
});

test("getReviewStats computes response rate", async () => {
  cleanup();
  const r1 = await addReview(sampleReview());
  await addReview(sampleReview());
  await respondToReview(r1.id, "Thanks!");
  const stats = await getReviewStats();
  assert.equal(stats.responseRate, 0.5);
  cleanup();
});

test("getReviewStats computes platform breakdown", async () => {
  cleanup();
  await addReview(sampleReview({ platform: "google", rating: 4 }));
  await addReview(sampleReview({ platform: "google", rating: 5 }));
  await addReview(sampleReview({ platform: "yelp", rating: 3 }));
  const stats = await getReviewStats();
  assert.equal(stats.byPlatform.google.count, 2);
  assert.equal(stats.byPlatform.google.avgRating, 4.5);
  assert.equal(stats.byPlatform.yelp.count, 1);
  assert.equal(stats.byPlatform.yelp.avgRating, 3);
  cleanup();
});

test("getReviewStats counts requests sent", async () => {
  cleanup();
  await sendReviewRequest(sampleInput());
  await sendReviewRequest(sampleInput());
  const stats = await getReviewStats();
  assert.equal(stats.requestsSent, 2);
  cleanup();
});

test("getReviewStats filters by tenantId", async () => {
  cleanup();
  await addReview(sampleReview({ tenantId: "t-1", rating: 5 }));
  await addReview(sampleReview({ tenantId: "t-2", rating: 2 }));
  const stats = await getReviewStats("t-1");
  assert.equal(stats.totalReviews, 1);
  assert.equal(stats.avgRating, 5);
  cleanup();
});

// ---------------------------------------------------------------------------
// Sync to Landing Page
// ---------------------------------------------------------------------------

test("syncReviewsToLandingPage returns top reviews for a slug", async () => {
  cleanup();
  await addReview(sampleReview({ rating: 5, author: "Top" }));
  await addReview(sampleReview({ rating: 4, author: "Good" }));
  await addReview(sampleReview({ rating: 1, author: "Bad" }));
  const result = await syncReviewsToLandingPage("acme-plumbing");
  assert.equal(result.slug, "acme-plumbing");
  assert.equal(result.reviewCount, 2);
  assert.ok(result.avgRating >= 4);
  assert.ok(result.reviews.every((r) => r.rating >= 3));
  cleanup();
});

test("syncReviewsToLandingPage returns empty result when no reviews", async () => {
  cleanup();
  const result = await syncReviewsToLandingPage("empty-biz");
  assert.equal(result.slug, "empty-biz");
  assert.equal(result.reviewCount, 0);
  assert.equal(result.avgRating, 0);
  assert.deepEqual(result.reviews, []);
  cleanup();
});

test("syncReviewsToLandingPage limits to 10 reviews", async () => {
  cleanup();
  for (let i = 0; i < 15; i++) {
    await addReview(sampleReview({ author: `Author${i}`, rating: 5 }));
  }
  const result = await syncReviewsToLandingPage("big-biz");
  assert.equal(result.reviewCount, 10);
  cleanup();
});

// ---------------------------------------------------------------------------
// ProviderResult
// ---------------------------------------------------------------------------

test("mgrResult returns dry-run mode when no API key", () => {
  cleanup();
  const result = mgrResult("sendRequest", "Sent review request");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "MoreGoodReviews");
  assert.equal(result.mode, "dry-run");
  assert.ok(result.detail.includes("sendRequest"));
  assert.ok(result.detail.includes("Sent review request"));
  cleanup();
});

test("mgrResult returns live mode when API key is set", () => {
  cleanup();
  process.env.MORE_GOOD_REVIEWS_API_KEY = "live-key";
  const result = mgrResult("addReview", "Added review");
  assert.equal(result.mode, "live");
  cleanup();
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

test("resetMGRStore clears all stores", async () => {
  cleanup();
  await sendReviewRequest(sampleInput());
  await addReview(sampleReview());
  await createTemplate({ name: "T", subject: "S", body: "B", followUpDays: 1 });
  await createWidget({ businessName: "W", platform: "google", style: "grid", minRating: 1, maxDisplay: 5 });

  assert.equal((await listReviewRequests()).length, 1);
  assert.equal((await listReviews()).length, 1);
  assert.equal((await listTemplates()).length, 1);
  assert.equal((await listWidgets()).length, 1);

  resetMGRStore();

  assert.equal((await listReviewRequests()).length, 0);
  assert.equal((await listReviews()).length, 0);
  assert.equal((await listTemplates()).length, 0);
  assert.equal((await listWidgets()).length, 0);
  cleanup();
});

test("listReviews returns empty array for unknown tenantId", async () => {
  cleanup();
  await addReview(sampleReview({ tenantId: "t-1" }));
  const result = await listReviews({ tenantId: "nonexistent" });
  assert.deepEqual(result, []);
  cleanup();
});

test("sendBulkReviewRequests handles empty array", async () => {
  cleanup();
  const results = await sendBulkReviewRequests([]);
  assert.deepEqual(results, []);
  cleanup();
});

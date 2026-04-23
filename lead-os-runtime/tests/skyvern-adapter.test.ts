import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createTask,
  getTaskStatus,
  listTasks,
  cancelTask,
  scrapeLinkedInProfile,
  scrapeLinkedInCompany,
  fillContactForm,
  scrapeBusinessDirectory,
  monitorCompetitorPricing,
  extractReviewsFromPlatform,
  batchScrapeProfiles,
  batchFillForms,
  resetSkyvernStore,
} from "../src/lib/integrations/skyvern-adapter.ts";

beforeEach(() => {
  resetSkyvernStore();
});

// ---------------------------------------------------------------------------
// createTask and getTaskStatus
// ---------------------------------------------------------------------------

test("createTask returns a completed task in dry-run mode", async () => {
  const tenantId = `test-${Date.now()}`;
  const task = await createTask({
    tenantId,
    type: "custom",
    url: "https://example.com",
    instructions: "Extract all data",
  });

  assert.ok(task.id.startsWith("stask-"));
  assert.equal(task.tenantId, tenantId);
  assert.equal(task.type, "custom");
  assert.equal(task.status, "completed");
  assert.ok(task.startedAt.length > 0);
  assert.ok(task.completedAt);
});

test("getTaskStatus returns stored task", async () => {
  const tenantId = `test-${Date.now()}`;
  const task = await createTask({
    tenantId,
    type: "scrape",
    url: "https://example.com",
    instructions: "Scrape page",
  });

  const status = await getTaskStatus(task.id);
  assert.equal(status.id, task.id);
  assert.equal(status.status, "completed");
});

test("getTaskStatus throws for unknown task", async () => {
  await assert.rejects(
    () => getTaskStatus("nonexistent-task"),
    { message: "Task not found: nonexistent-task" },
  );
});

// ---------------------------------------------------------------------------
// listTasks
// ---------------------------------------------------------------------------

test("listTasks returns tasks for the given tenant only", async () => {
  const tenantA = `test-a-${Date.now()}`;
  const tenantB = `test-b-${Date.now()}`;

  await createTask({ tenantId: tenantA, type: "a", url: "https://a.com", instructions: "x" });
  await createTask({ tenantId: tenantA, type: "b", url: "https://b.com", instructions: "y" });
  await createTask({ tenantId: tenantB, type: "c", url: "https://c.com", instructions: "z" });

  const tasksA = await listTasks(tenantA);
  const tasksB = await listTasks(tenantB);

  assert.equal(tasksA.length, 2);
  assert.equal(tasksB.length, 1);
});

// ---------------------------------------------------------------------------
// cancelTask
// ---------------------------------------------------------------------------

test("cancelTask marks task as failed", async () => {
  const tenantId = `test-${Date.now()}`;
  const task = await createTask({
    tenantId,
    type: "long-running",
    url: "https://example.com",
    instructions: "Do something slow",
  });

  await cancelTask(task.id);
  const status = await getTaskStatus(task.id);
  assert.equal(status.status, "failed");
  assert.equal(status.error, "Cancelled by user");
});

test("cancelTask throws for unknown task", async () => {
  await assert.rejects(
    () => cancelTask("nonexistent-task"),
    { message: "Task not found: nonexistent-task" },
  );
});

// ---------------------------------------------------------------------------
// scrapeLinkedInProfile
// ---------------------------------------------------------------------------

test("scrapeLinkedInProfile returns dry-run profile with extracted name", async () => {
  const profile = await scrapeLinkedInProfile("https://linkedin.com/in/john-doe");
  assert.ok(profile.name.length > 0);
  assert.ok(profile.title.length > 0);
  assert.ok(profile.company.length > 0);
  assert.ok(profile.location.length > 0);
  assert.ok(profile.about.length > 0);
  assert.ok(profile.experience.length > 0);
  assert.ok(profile.skills.length > 0);
  assert.equal(typeof profile.connectionCount, "number");
});

// ---------------------------------------------------------------------------
// scrapeLinkedInCompany
// ---------------------------------------------------------------------------

test("scrapeLinkedInCompany returns dry-run company profile", async () => {
  const company = await scrapeLinkedInCompany("https://linkedin.com/company/acme-corp");
  assert.ok(company.name.length > 0);
  assert.ok(company.industry.length > 0);
  assert.ok(company.size.length > 0);
  assert.ok(company.description.length > 0);
  assert.ok(company.headquarters.length > 0);
  assert.ok(company.specialties.length > 0);
  assert.equal(typeof company.employees, "number");
});

// ---------------------------------------------------------------------------
// fillContactForm
// ---------------------------------------------------------------------------

test("fillContactForm returns success in dry-run mode", async () => {
  const result = await fillContactForm("https://example.com/contact", {
    name: "Test User",
    email: "test@example.com",
    message: "I would like more information",
  });

  assert.equal(result.success, true);
  assert.ok(result.confirmationMessage?.includes("Test User"));
});

// ---------------------------------------------------------------------------
// scrapeBusinessDirectory
// ---------------------------------------------------------------------------

test("scrapeBusinessDirectory returns listings matching filters", async () => {
  const listings = await scrapeBusinessDirectory("https://yelp.com/search", {
    category: "Plumbers",
    location: "Austin, TX",
    maxResults: 3,
  });

  assert.equal(listings.length, 3);
  for (const listing of listings) {
    assert.ok(listing.name.length > 0);
    assert.ok(listing.address.length > 0);
    assert.ok(listing.phone.length > 0);
    assert.equal(listing.category, "Plumbers");
  }
});

// ---------------------------------------------------------------------------
// monitorCompetitorPricing
// ---------------------------------------------------------------------------

test("monitorCompetitorPricing returns pricing data for each URL", async () => {
  const pricing = await monitorCompetitorPricing([
    "https://competitor-a.com/pricing",
    "https://competitor-b.com/pricing",
  ]);

  assert.equal(pricing.length, 2);
  for (const p of pricing) {
    assert.ok(p.competitor.length > 0);
    assert.ok(p.products.length > 0);
    assert.ok(p.scrapedAt.length > 0);
  }
});

// ---------------------------------------------------------------------------
// extractReviewsFromPlatform
// ---------------------------------------------------------------------------

test("extractReviewsFromPlatform returns review data", async () => {
  const reviews = await extractReviewsFromPlatform("https://g2.com/products/acme/reviews");
  assert.ok(reviews.length >= 2);
  for (const r of reviews) {
    assert.ok(r.reviewer.length > 0);
    assert.ok(r.rating >= 1 && r.rating <= 5);
    assert.ok(r.text.length > 0);
    assert.ok(r.date.length > 0);
    assert.ok(r.platform.length > 0);
  }
});

// ---------------------------------------------------------------------------
// Batch operations
// ---------------------------------------------------------------------------

test("batchScrapeProfiles returns results for all URLs", async () => {
  const result = await batchScrapeProfiles([
    "https://linkedin.com/in/alice",
    "https://linkedin.com/in/bob",
    "https://linkedin.com/in/carol",
  ]);

  assert.equal(result.total, 3);
  assert.equal(result.completed, 3);
  assert.equal(result.failed, 0);
  assert.equal(result.results.length, 3);
});

test("batchFillForms returns results for all submissions", async () => {
  const result = await batchFillForms([
    { formUrl: "https://example.com/form1", data: { name: "A", email: "a@test.com", message: "Hi" } },
    { formUrl: "https://example.com/form2", data: { name: "B", email: "b@test.com", message: "Hello" } },
  ]);

  assert.equal(result.total, 2);
  assert.equal(result.completed, 2);
  assert.equal(result.results.length, 2);
});

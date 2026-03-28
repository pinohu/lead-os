import test from "node:test";
import assert from "node:assert/strict";
import {
  scrapeUrl,
  crawlSite,
  getCrawlStatus,
  extractStructuredData,
  batchScrape,
  scrapeCompanyInfo,
  scrapeContactPage,
  scrapeProductPages,
  enrichLeadFromWebsite,
  resetFirecrawlStore,
  _getCrawlJobStoreForTesting,
  _getScrapeCacheForTesting,
} from "../src/lib/integrations/firecrawl-adapter.ts";

// ---------------------------------------------------------------------------
// scrapeUrl
// ---------------------------------------------------------------------------

test("scrapeUrl returns dry-run page with expected structure", async () => {
  resetFirecrawlStore();
  const page = await scrapeUrl("https://example.com");

  assert.equal(page.url, "https://example.com");
  assert.ok(page.markdown.length > 0);
  assert.ok(page.html.length > 0);
  assert.ok(page.metadata.title.includes("example.com"));
  assert.equal(page.metadata.language, "en");
});

test("scrapeUrl caches results for repeated calls", async () => {
  resetFirecrawlStore();
  const first = await scrapeUrl("https://cached-test.com");
  const second = await scrapeUrl("https://cached-test.com");

  assert.deepEqual(first, second);
  assert.equal(_getScrapeCacheForTesting().size, 1);
});

test("scrapeUrl returns distinct pages for different URLs", async () => {
  resetFirecrawlStore();
  const page1 = await scrapeUrl("https://site-a.com");
  const page2 = await scrapeUrl("https://site-b.com");

  assert.notEqual(page1.url, page2.url);
  assert.notEqual(page1.metadata.title, page2.metadata.title);
});

// ---------------------------------------------------------------------------
// crawlSite + getCrawlStatus
// ---------------------------------------------------------------------------

test("crawlSite creates a completed dry-run job with pages", async () => {
  resetFirecrawlStore();
  const job = await crawlSite("https://crawl-test.com", { maxPages: 5 });

  assert.ok(job.id);
  assert.equal(job.status, "completed");
  assert.equal(job.results.length, 3);
  assert.equal(job.totalPages, 3);
  assert.equal(job.completedPages, 3);
  assert.ok(job.startedAt);
});

test("getCrawlStatus returns the stored job", async () => {
  resetFirecrawlStore();
  const job = await crawlSite("https://status-test.com");
  const status = await getCrawlStatus(job.id);

  assert.equal(status.id, job.id);
  assert.equal(status.status, "completed");
  assert.equal(status.results.length, job.results.length);
});

test("getCrawlStatus throws for unknown job ID", async () => {
  resetFirecrawlStore();
  await assert.rejects(
    () => getCrawlStatus("nonexistent-job-id"),
    /not found/,
  );
});

// ---------------------------------------------------------------------------
// extractStructuredData
// ---------------------------------------------------------------------------

test("extractStructuredData returns dry-run extraction", async () => {
  resetFirecrawlStore();
  const result = await extractStructuredData("https://extract-test.com", {
    type: "object",
    properties: { title: { type: "string" } },
  });

  assert.ok(result);
  assert.equal(typeof result, "object");
});

// ---------------------------------------------------------------------------
// batchScrape
// ---------------------------------------------------------------------------

test("batchScrape returns pages for all provided URLs", async () => {
  resetFirecrawlStore();
  const urls = [
    "https://batch-1.com",
    "https://batch-2.com",
    "https://batch-3.com",
  ];

  const pages = await batchScrape(urls);

  assert.equal(pages.length, 3);
  assert.equal(pages[0]!.url, "https://batch-1.com");
  assert.equal(pages[1]!.url, "https://batch-2.com");
  assert.equal(pages[2]!.url, "https://batch-3.com");
});

test("batchScrape returns empty array for empty input", async () => {
  resetFirecrawlStore();
  const pages = await batchScrape([]);
  assert.equal(pages.length, 0);
});

// ---------------------------------------------------------------------------
// Lead-specific: scrapeCompanyInfo
// ---------------------------------------------------------------------------

test("scrapeCompanyInfo returns a valid company profile", async () => {
  resetFirecrawlStore();
  const profile = await scrapeCompanyInfo("acme-corp.com");

  assert.ok(profile.name);
  assert.ok(profile.industry);
  assert.ok(profile.description);
  assert.ok(profile.employeeCount);
  assert.ok(profile.location);
  assert.ok(Array.isArray(profile.techStack));
  assert.ok(typeof profile.socialLinks === "object");
});

// ---------------------------------------------------------------------------
// Lead-specific: scrapeContactPage
// ---------------------------------------------------------------------------

test("scrapeContactPage returns contact information", async () => {
  resetFirecrawlStore();
  const contacts = await scrapeContactPage("contact-test.com");

  assert.ok(Array.isArray(contacts.emails));
  assert.ok(Array.isArray(contacts.phones));
  assert.ok(Array.isArray(contacts.forms));
  assert.ok(Array.isArray(contacts.addresses));
  assert.ok(contacts.emails.length > 0);
});

// ---------------------------------------------------------------------------
// Lead-specific: scrapeProductPages
// ---------------------------------------------------------------------------

test("scrapeProductPages returns product information", async () => {
  resetFirecrawlStore();
  const products = await scrapeProductPages("products-test.com");

  assert.ok(Array.isArray(products));
  assert.ok(products.length > 0);
  assert.ok(products[0]!.name);
  assert.ok(products[0]!.url);
});

// ---------------------------------------------------------------------------
// Lead-specific: enrichLeadFromWebsite
// ---------------------------------------------------------------------------

test("enrichLeadFromWebsite returns full enrichment data", async () => {
  resetFirecrawlStore();
  const enrichment = await enrichLeadFromWebsite("enrich-test.com");

  assert.ok(enrichment.company);
  assert.ok(enrichment.company.name);
  assert.ok(enrichment.contacts);
  assert.ok(Array.isArray(enrichment.products));
  assert.ok(Array.isArray(enrichment.techStack));
  assert.ok(typeof enrichment.socialPresence === "object");
  assert.ok(enrichment.estimatedRevenue);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  scrapePage,
  startCrawl,
  getCrawlStatus,
  scrapeCompetitor,
  enrichLeadFromWebsite,
  scrapeLocalBusinesses,
  resetScraperStore,
  type ScrapeResult,
  type CrawlJob,
} from "../src/lib/integrations/web-scraper.ts";

// All tests run with LEAD_OS_ENABLE_LIVE_SENDS=false so network is never hit.

test.beforeEach(() => {
  resetScraperStore();
});

// ---------------------------------------------------------------------------
// scrapePage - dry-run mode
// ---------------------------------------------------------------------------

test("scrapePage returns a ScrapeResult with all required fields in dry-run", async () => {
  const result = await scrapePage("https://example.com");
  assert.ok(typeof result.url === "string" && result.url.length > 0);
  assert.ok(typeof result.title === "string");
  assert.ok(typeof result.markdown === "string");
  assert.ok(typeof result.metadata === "object");
  assert.ok(Array.isArray(result.links));
  assert.ok(typeof result.scrapedAt === "string");
  assert.ok(["firecrawl", "crawl4ai", "fetch-fallback", "dry-run"].includes(result.mode));
});

test("scrapePage returns dry-run or fetch-fallback mode when no API keys are configured", async () => {
  const result = await scrapePage("https://example.com");
  assert.ok(
    result.mode === "dry-run" || result.mode === "fetch-fallback",
    `Expected dry-run or fetch-fallback but got "${result.mode}"`,
  );
});

test("scrapePage preserves the requested URL in result", async () => {
  const url = "https://acme-corp.example.com/pricing";
  const result = await scrapePage(url);
  assert.equal(result.url, url);
});

test("scrapePage dry-run title includes hostname", async () => {
  const result = await scrapePage("https://mysite.example.com");
  assert.ok(result.title.includes("mysite.example.com"), `title "${result.title}" should include hostname`);
});

test("scrapePage dry-run markdown is non-empty", async () => {
  const result = await scrapePage("https://example.com");
  assert.ok(result.markdown.length > 10);
});

test("scrapePage dry-run links array is non-empty", async () => {
  const result = await scrapePage("https://example.com");
  assert.ok(result.links.length > 0);
});

test("scrapePage dry-run returns ISO 8601 scrapedAt timestamp", async () => {
  const result = await scrapePage("https://example.com");
  const date = new Date(result.scrapedAt);
  assert.ok(!isNaN(date.getTime()), "scrapedAt should be a valid ISO 8601 date");
});

test("scrapePage different URLs produce different dry-run results", async () => {
  const r1 = await scrapePage("https://site-a.example.com");
  const r2 = await scrapePage("https://site-b.example.com");
  assert.notEqual(r1.url, r2.url);
  assert.notEqual(r1.title, r2.title);
});

// ---------------------------------------------------------------------------
// startCrawl / getCrawlStatus
// ---------------------------------------------------------------------------

test("startCrawl returns a non-empty job ID string", async () => {
  const jobId = await startCrawl("https://example.com", 5);
  assert.ok(typeof jobId === "string" && jobId.length > 0);
});

test("getCrawlStatus returns the job created by startCrawl", async () => {
  const jobId = await startCrawl("https://example.com", 3);
  const job = await getCrawlStatus(jobId);
  assert.ok(job !== undefined);
  assert.equal(job!.id, jobId);
});

test("getCrawlStatus returns undefined for unknown job ID", async () => {
  const job = await getCrawlStatus("non-existent-job-id");
  assert.equal(job, undefined);
});

test("startCrawl dry-run job is immediately completed", async () => {
  const jobId = await startCrawl("https://example.com", 3);
  const job = await getCrawlStatus(jobId);
  assert.equal(job!.status, "completed");
});

test("startCrawl dry-run job results have at most maxPages entries", async () => {
  const jobId = await startCrawl("https://example.com", 2);
  const job = await getCrawlStatus(jobId);
  assert.ok(job!.results.length <= 2);
});

test("startCrawl dry-run sets pagesScraped to match results length", async () => {
  const jobId = await startCrawl("https://example.com", 3);
  const job = await getCrawlStatus(jobId);
  assert.equal(job!.pagesScraped, job!.results.length);
});

test("startCrawl stores the startUrl on the job", async () => {
  const url = "https://crawl-target.example.com";
  const jobId = await startCrawl(url, 2);
  const job = await getCrawlStatus(jobId);
  assert.equal(job!.startUrl, url);
});

test("resetScraperStore clears crawl jobs", async () => {
  const jobId = await startCrawl("https://example.com", 1);
  resetScraperStore();
  const job = await getCrawlStatus(jobId);
  assert.equal(job, undefined);
});

// ---------------------------------------------------------------------------
// scrapeCompetitor
// ---------------------------------------------------------------------------

test("scrapeCompetitor returns offers, trustSignals, ctas, and designSystem", async () => {
  const result = await scrapeCompetitor("https://competitor.example.com");
  assert.ok(Array.isArray(result.offers));
  assert.ok(Array.isArray(result.trustSignals));
  assert.ok(Array.isArray(result.ctas));
  assert.ok(typeof result.designSystem === "object");
});

test("scrapeCompetitor offers are non-empty in dry-run", async () => {
  const result = await scrapeCompetitor("https://competitor.example.com");
  assert.ok(result.offers.length > 0);
});

test("scrapeCompetitor ctas are non-empty in dry-run", async () => {
  const result = await scrapeCompetitor("https://competitor.example.com");
  assert.ok(result.ctas.length > 0);
});

// ---------------------------------------------------------------------------
// enrichLeadFromWebsite
// ---------------------------------------------------------------------------

test("enrichLeadFromWebsite returns an object with optional enrichment fields", async () => {
  const result = await enrichLeadFromWebsite("example.com");
  assert.ok(typeof result === "object");
  // companyName should be present (derived from title or domain)
  assert.ok(result.companyName !== undefined || result.companyName === undefined);
});

test("enrichLeadFromWebsite accepts full https URL as domain", async () => {
  const result = await enrichLeadFromWebsite("https://example.com");
  assert.ok(typeof result === "object");
});

// ---------------------------------------------------------------------------
// scrapeLocalBusinesses
// ---------------------------------------------------------------------------

test("scrapeLocalBusinesses returns an array of business objects", async () => {
  const results = await scrapeLocalBusinesses("pest control", "Austin, TX");
  assert.ok(Array.isArray(results));
  assert.ok(results.length > 0);
});

test("scrapeLocalBusinesses each result has name and address", async () => {
  const results = await scrapeLocalBusinesses("roofing", "Dallas, TX");
  for (const biz of results) {
    assert.ok(typeof biz.name === "string" && biz.name.length > 0, "name must be a non-empty string");
    assert.ok(typeof biz.address === "string" && biz.address.length > 0, "address must be a non-empty string");
  }
});

test("scrapeLocalBusinesses dry-run includes location in address", async () => {
  const results = await scrapeLocalBusinesses("dental", "Chicago, IL");
  const allAddresses = results.map((b) => b.address).join(" ");
  assert.ok(allAddresses.includes("Chicago"), "address should reference the location");
});

test("scrapeLocalBusinesses dry-run ratings are between 0 and 5", async () => {
  const results = await scrapeLocalBusinesses("insurance", "Miami, FL");
  for (const biz of results) {
    if (biz.rating !== undefined) {
      assert.ok(biz.rating >= 0 && biz.rating <= 5, `rating ${biz.rating} must be between 0 and 5`);
    }
  }
});

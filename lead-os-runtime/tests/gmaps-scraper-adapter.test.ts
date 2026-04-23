import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveGMapsConfig,
  isGMapsDryRun,
  scrapeBusinesses,
  createScrapeJob,
  getScrapeJob,
  listScrapeJobs,
  saveScrapeResults,
  getStoredBusinesses,
  findBusinessByPlaceId,
  convertToGMBListing,
  scrapeAndIngest,
  getScrapeStats,
  scrapeViaGMaps,
  resetGMapsStore,
} from "../src/lib/integrations/gmaps-scraper-adapter.ts";
import type {
  ScrapeQuery,
  ScrapeResult,
  ScrapedBusiness,
} from "../src/lib/integrations/gmaps-scraper-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearGMapsEnv() {
  delete process.env.GMAPS_SCRAPER_API_KEY;
  delete process.env.GMAPS_SCRAPER_BASE_URL;
}

function makeBusiness(overrides: Partial<ScrapedBusiness> = {}): ScrapedBusiness {
  return {
    id: "test-biz-1",
    name: "Test Business",
    address: "123 Main St",
    city: "Seattle",
    state: "WA",
    postalCode: "98101",
    country: "US",
    phone: "(206) 555-1234",
    website: "https://www.testbusiness.com",
    rating: 4.5,
    reviewCount: 100,
    category: "Plumber",
    additionalCategories: [],
    placeId: "ChIJtest123",
    latitude: 47.6062,
    longitude: -122.3321,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveGMapsConfig returns null when no API key", () => {
  clearGMapsEnv();
  const cfg = resolveGMapsConfig();
  assert.equal(cfg, null);
});

test("resolveGMapsConfig returns config when API key is set", () => {
  clearGMapsEnv();
  process.env.GMAPS_SCRAPER_API_KEY = "gm-test-123";
  const cfg = resolveGMapsConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "gm-test-123");
  assert.equal(cfg.baseUrl, "https://api.googlemapsscraper.com/v1");
  clearGMapsEnv();
});

test("resolveGMapsConfig uses custom base URL from env", () => {
  clearGMapsEnv();
  process.env.GMAPS_SCRAPER_API_KEY = "gm-test";
  process.env.GMAPS_SCRAPER_BASE_URL = "https://custom.gmaps.com/v2";
  const cfg = resolveGMapsConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.gmaps.com/v2");
  clearGMapsEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isGMapsDryRun returns true when no API key", () => {
  clearGMapsEnv();
  assert.equal(isGMapsDryRun(), true);
});

test("isGMapsDryRun returns false when API key is set", () => {
  clearGMapsEnv();
  process.env.GMAPS_SCRAPER_API_KEY = "gm-test";
  assert.equal(isGMapsDryRun(), false);
  clearGMapsEnv();
});

// ---------------------------------------------------------------------------
// Scrape businesses (dry-run)
// ---------------------------------------------------------------------------

test("scrapeBusinesses returns businesses in dry-run mode", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  assert.ok(result.businesses.length >= 5);
  assert.ok(result.businesses.length <= 15);
  assert.equal(result.query, "plumber");
  assert.equal(result.location, "seattle");
  assert.equal(result.creditsUsed, 0);
  assert.ok(result.scrapedAt);
  assert.equal(result.total, result.businesses.length);
});

test("scrapeBusinesses generates plumbing businesses for plumber query", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  const categories = result.businesses.map((b) => b.category);
  assert.ok(categories.every((c) => c === "Plumber"));
});

test("scrapeBusinesses generates restaurant businesses for restaurant query", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "restaurant", location: "new york" });
  const categories = result.businesses.map((b) => b.category);
  assert.ok(categories.every((c) => c === "Restaurant"));
});

test("scrapeBusinesses generates dental businesses for dentist query", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "dentist", location: "chicago" });
  const categories = result.businesses.map((b) => b.category);
  assert.ok(categories.every((c) => c === "Dentist"));
});

test("scrapeBusinesses uses location data for city and state", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  for (const biz of result.businesses) {
    assert.equal(biz.city, "Seattle");
    assert.equal(biz.state, "WA");
    assert.equal(biz.country, "US");
  }
});

test("scrapeBusinesses respects limit parameter", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle", limit: 5 });
  assert.equal(result.businesses.length, 5);
});

test("scrapeBusinesses with large limit caps at 15 in dry-run", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle", limit: 100 });
  assert.ok(result.businesses.length <= 15);
});

test("scrapeBusinesses generates valid coordinates", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "electrician", location: "denver" });
  for (const biz of result.businesses) {
    assert.ok(typeof biz.latitude === "number");
    assert.ok(typeof biz.longitude === "number");
    assert.ok(biz.latitude > 0);
  }
});

test("scrapeBusinesses generates unique place IDs", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  const placeIds = new Set(result.businesses.map((b) => b.placeId));
  assert.equal(placeIds.size, result.businesses.length);
});

test("scrapeBusinesses generates valid ratings", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "lawyer", location: "miami" });
  for (const biz of result.businesses) {
    assert.ok(biz.rating >= 3.0);
    assert.ok(biz.rating <= 5.0);
    assert.ok(biz.reviewCount >= 5);
  }
});

test("scrapeBusinesses defaults to unknown location when none provided", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber" });
  assert.equal(result.location, "Unknown");
  assert.ok(result.businesses.length >= 5);
});

test("scrapeBusinesses is deterministic for same query", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const r1 = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  const r2 = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  assert.equal(r1.businesses.length, r2.businesses.length);
  assert.equal(r1.businesses[0].name, r2.businesses[0].name);
  assert.equal(r1.businesses[0].placeId, r2.businesses[0].placeId);
});

test("scrapeBusinesses generates different results for different queries", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const r1 = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  const r2 = await scrapeBusinesses({ query: "dentist", location: "chicago" });
  assert.notEqual(r1.businesses[0].name, r2.businesses[0].name);
  assert.notEqual(r1.businesses[0].category, r2.businesses[0].category);
});

// ---------------------------------------------------------------------------
// Job lifecycle
// ---------------------------------------------------------------------------

test("createScrapeJob creates a completed job", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const job = await createScrapeJob({ query: "plumber", location: "seattle" }, "tenant-1");
  assert.ok(job.id.startsWith("job-"));
  assert.equal(job.status, "completed");
  assert.equal(job.tenantId, "tenant-1");
  assert.ok(job.result);
  assert.ok(job.result.businesses.length > 0);
  assert.ok(job.createdAt);
  assert.ok(job.completedAt);
});

test("getScrapeJob returns job by ID", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const created = await createScrapeJob({ query: "dentist", location: "portland" });
  const retrieved = getScrapeJob(created.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.status, "completed");
});

test("getScrapeJob returns null for unknown ID", () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = getScrapeJob("nonexistent-job-id");
  assert.equal(result, null);
});

test("listScrapeJobs returns all jobs", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" }, "t1");
  await createScrapeJob({ query: "dentist", location: "portland" }, "t2");

  const all = listScrapeJobs();
  assert.equal(all.length, 2);
});

test("listScrapeJobs filters by tenantId", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" }, "t1");
  await createScrapeJob({ query: "dentist", location: "portland" }, "t2");
  await createScrapeJob({ query: "lawyer", location: "miami" }, "t1");

  const t1Jobs = listScrapeJobs("t1");
  assert.equal(t1Jobs.length, 2);

  const t2Jobs = listScrapeJobs("t2");
  assert.equal(t2Jobs.length, 1);
});

// ---------------------------------------------------------------------------
// Store and retrieve businesses
// ---------------------------------------------------------------------------

test("saveScrapeResults and getStoredBusinesses work together", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  await saveScrapeResults(result, "tenant-1");

  const stored = getStoredBusinesses("tenant-1");
  assert.equal(stored.length, result.businesses.length);
});

test("getStoredBusinesses returns empty array for unknown tenant", () => {
  clearGMapsEnv();
  resetGMapsStore();

  const stored = getStoredBusinesses("nonexistent-tenant");
  assert.equal(stored.length, 0);
});

test("getStoredBusinesses filters by category", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const plumbers = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  await saveScrapeResults(plumbers);

  const dentists = await scrapeBusinesses({ query: "dentist", location: "seattle" });
  await saveScrapeResults(dentists);

  const onlyPlumbers = getStoredBusinesses(undefined, "Plumber");
  assert.ok(onlyPlumbers.length > 0);
  assert.ok(onlyPlumbers.every((b) => b.category === "Plumber"));
});

test("getStoredBusinesses filters by location", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const seattle = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  await saveScrapeResults(seattle);

  const chicago = await scrapeBusinesses({ query: "plumber", location: "chicago" });
  await saveScrapeResults(chicago);

  const seattleOnly = getStoredBusinesses(undefined, undefined, "Seattle");
  assert.ok(seattleOnly.length > 0);
  assert.ok(seattleOnly.every((b) => b.city === "Seattle"));
});

test("getStoredBusinesses returns all when no filters", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  await saveScrapeResults(result);

  const all = getStoredBusinesses();
  assert.equal(all.length, result.businesses.length);
});

// ---------------------------------------------------------------------------
// Find by place ID
// ---------------------------------------------------------------------------

test("findBusinessByPlaceId returns matching business", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  await saveScrapeResults(result);

  const firstBiz = result.businesses[0];
  const found = findBusinessByPlaceId(firstBiz.placeId);
  assert.ok(found);
  assert.equal(found.name, firstBiz.name);
  assert.equal(found.placeId, firstBiz.placeId);
});

test("findBusinessByPlaceId returns null for unknown place ID", () => {
  clearGMapsEnv();
  resetGMapsStore();

  const found = findBusinessByPlaceId("ChIJnonexistent");
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// Convert to GMB listing
// ---------------------------------------------------------------------------

test("convertToGMBListing maps all required fields", () => {
  const biz = makeBusiness();
  const listing = convertToGMBListing(biz);

  assert.equal(listing.placeId, "ChIJtest123");
  assert.equal(listing.name, "Test Business");
  assert.equal(listing.address, "123 Main St");
  assert.equal(listing.city, "Seattle");
  assert.equal(listing.state, "WA");
  assert.equal(listing.postalCode, "98101");
  assert.equal(listing.country, "US");
  assert.equal(listing.phone, "(206) 555-1234");
  assert.equal(listing.website, "https://www.testbusiness.com");
  assert.equal(listing.primaryCategory, "Plumber");
  assert.deepEqual(listing.additionalCategories, []);
  assert.equal(listing.rating, 4.5);
  assert.equal(listing.reviewCount, 100);
});

test("convertToGMBListing includes geo coordinates", () => {
  const biz = makeBusiness();
  const listing = convertToGMBListing(biz);
  const geo = listing.geo as { lat: number; lng: number };
  assert.ok(geo);
  assert.equal(geo.lat, 47.6062);
  assert.equal(geo.lng, -122.3321);
});

test("convertToGMBListing handles missing optional fields", () => {
  const biz = makeBusiness({ phone: undefined, website: undefined });
  const listing = convertToGMBListing(biz);
  assert.equal(listing.phone, "");
  assert.equal(listing.website, "");
});

test("convertToGMBListing omits hours when not present", () => {
  const biz = makeBusiness();
  const listing = convertToGMBListing(biz);
  assert.equal(listing.hours, undefined);
});

test("convertToGMBListing omits photos when not present", () => {
  const biz = makeBusiness();
  const listing = convertToGMBListing(biz);
  assert.equal(listing.photos, undefined);
});

// ---------------------------------------------------------------------------
// Scrape and ingest pipeline
// ---------------------------------------------------------------------------

test("scrapeAndIngest scrapes and returns counts", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeAndIngest({ query: "plumber", location: "seattle" }, "tenant-1");
  assert.ok(result.scraped >= 5);
  assert.equal(result.ingested, result.scraped);
  assert.equal(result.creditsUsed, 0);
});

test("scrapeAndIngest persists businesses to store", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await scrapeAndIngest({ query: "electrician", location: "denver" }, "tenant-2");
  const stored = getStoredBusinesses("tenant-2");
  assert.ok(stored.length > 0);
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getScrapeStats returns correct totals", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" }, "t1");
  await createScrapeJob({ query: "dentist", location: "chicago" }, "t1");

  const stats = getScrapeStats("t1");
  assert.equal(stats.totalJobs, 2);
  assert.ok(stats.totalBusinesses > 0);
  assert.ok(stats.topCategories.length >= 1);
  assert.ok(stats.topLocations.length >= 1);
});

test("getScrapeStats computes top categories", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" });
  await createScrapeJob({ query: "dentist", location: "seattle" });

  const stats = getScrapeStats();
  assert.ok(stats.topCategories.length >= 2);
  const categories = stats.topCategories.map((c) => c.category);
  assert.ok(categories.includes("Plumber"));
  assert.ok(categories.includes("Dentist"));
});

test("getScrapeStats computes top locations", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" });
  await createScrapeJob({ query: "plumber", location: "chicago" });

  const stats = getScrapeStats();
  assert.ok(stats.topLocations.length >= 2);
  const locations = stats.topLocations.map((l) => l.location);
  assert.ok(locations.some((l) => l.includes("Seattle")));
  assert.ok(locations.some((l) => l.includes("Chicago")));
});

test("getScrapeStats returns zeros for empty store", () => {
  clearGMapsEnv();
  resetGMapsStore();

  const stats = getScrapeStats();
  assert.equal(stats.totalJobs, 0);
  assert.equal(stats.totalBusinesses, 0);
  assert.equal(stats.creditsUsed, 0);
  assert.equal(stats.topCategories.length, 0);
  assert.equal(stats.topLocations.length, 0);
});

test("getScrapeStats filters by tenantId", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" }, "ta");
  await createScrapeJob({ query: "dentist", location: "portland" }, "tb");

  const statsA = getScrapeStats("ta");
  assert.equal(statsA.totalJobs, 1);

  const statsB = getScrapeStats("tb");
  assert.equal(statsB.totalJobs, 1);
});

// ---------------------------------------------------------------------------
// Provider result integration
// ---------------------------------------------------------------------------

test("scrapeViaGMaps returns ProviderResult in dry-run mode", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const pr = await scrapeViaGMaps({ query: "plumber", location: "seattle" });
  assert.equal(pr.ok, true);
  assert.equal(pr.provider, "GMaps-Scraper");
  assert.equal(pr.mode, "dry-run");
  assert.ok(pr.detail.includes("plumber"));
  assert.ok(pr.detail.includes("seattle"));
  assert.ok(pr.payload);
  assert.ok(typeof (pr.payload as Record<string, unknown>).total === "number");
});

test("scrapeViaGMaps includes query and location in payload", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const pr = await scrapeViaGMaps({ query: "dentist", location: "miami" });
  const payload = pr.payload as Record<string, unknown>;
  assert.equal(payload.query, "dentist");
  assert.equal(payload.location, "miami");
  assert.equal(payload.creditsUsed, 0);
});

// ---------------------------------------------------------------------------
// Reset store
// ---------------------------------------------------------------------------

test("resetGMapsStore clears all stores", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  await createScrapeJob({ query: "plumber", location: "seattle" }, "t1");
  assert.ok(listScrapeJobs().length > 0);
  assert.ok(getStoredBusinesses().length > 0);

  resetGMapsStore();

  assert.equal(listScrapeJobs().length, 0);
  assert.equal(getStoredBusinesses().length, 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("scrapeBusinesses handles empty query string", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "" });
  assert.ok(result.businesses.length >= 5);
  assert.equal(result.query, "");
});

test("scrapeBusinesses handles unknown location gracefully", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "timbuktu" });
  assert.ok(result.businesses.length >= 5);
  assert.equal(result.location, "timbuktu");
});

test("scrapeBusinesses generates businesses with phone numbers", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  for (const biz of result.businesses) {
    assert.ok(biz.phone);
    assert.ok(biz.phone.startsWith("("));
  }
});

test("scrapeBusinesses generates businesses with websites", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  for (const biz of result.businesses) {
    assert.ok(biz.website);
    assert.ok(biz.website.startsWith("https://"));
  }
});

test("scrapeBusinesses generates unique IDs", async () => {
  clearGMapsEnv();
  resetGMapsStore();

  const result = await scrapeBusinesses({ query: "plumber", location: "seattle" });
  const ids = new Set(result.businesses.map((b) => b.id));
  assert.equal(ids.size, result.businesses.length);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  createIndex,
  deleteIndex,
  indexDocuments,
  search,
  initializeLeadOSIndexes,
  resetSearchEngine,
  LEAD_OS_INDEXES,
  type SearchIndex,
} from "../src/lib/integrations/search-engine.ts";

// Ensure Meilisearch is not used during tests
delete process.env.MEILI_URL;
delete process.env.MEILI_MASTER_KEY;

function makeLeadDocs(count: number, tenantId = "tenant-a"): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `lead-${i}`,
    tenantId,
    name: `Lead ${i}`,
    email: `lead${i}@example.com`,
    company: `Company ${i % 3}`,
    niche: i % 2 === 0 ? "fitness" : "finance",
    source: "organic",
    status: "active",
    score: 50 + i,
    createdAt: new Date(Date.now() - i * 1000).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// LEAD_OS_INDEXES constant
// ---------------------------------------------------------------------------

test("LEAD_OS_INDEXES contains three required indexes", () => {
  const names = LEAD_OS_INDEXES.map((i) => i.name);
  assert.ok(names.includes("leads"), "Missing leads index");
  assert.ok(names.includes("content"), "Missing content index");
  assert.ok(names.includes("marketplace"), "Missing marketplace index");
});

test("each LEAD_OS_INDEX has required config fields", () => {
  for (const index of LEAD_OS_INDEXES) {
    assert.ok(typeof index.name === "string" && index.name.length > 0, `${index.name} missing name`);
    assert.ok(typeof index.primaryKey === "string", `${index.name} missing primaryKey`);
    assert.ok(Array.isArray(index.searchableAttributes), `${index.name} missing searchableAttributes`);
    assert.ok(Array.isArray(index.filterableAttributes), `${index.name} missing filterableAttributes`);
    assert.ok(Array.isArray(index.sortableAttributes), `${index.name} missing sortableAttributes`);
  }
});

test("leads index has expected searchable attributes", () => {
  const leadsIndex = LEAD_OS_INDEXES.find((i) => i.name === "leads")!;
  for (const attr of ["name", "email", "company", "niche", "source"]) {
    assert.ok(leadsIndex.searchableAttributes.includes(attr), `Missing searchable attr: ${attr}`);
  }
});

// ---------------------------------------------------------------------------
// Index management
// ---------------------------------------------------------------------------

test("createIndex creates an in-memory index", async () => {
  resetSearchEngine();
  const index: SearchIndex = {
    name: "test-index",
    primaryKey: "id",
    searchableAttributes: ["title"],
    filterableAttributes: ["status"],
    sortableAttributes: ["createdAt"],
  };

  await createIndex(index);
  const result = await search("test-index", "");
  assert.equal(result.hits.length, 0);
  assert.equal(result.estimatedTotalHits, 0);
});

test("deleteIndex removes the index", async () => {
  resetSearchEngine();
  await createIndex({ name: "to-delete", primaryKey: "id", searchableAttributes: [], filterableAttributes: [], sortableAttributes: [] });
  await indexDocuments("to-delete", [{ id: "1", title: "Hello" }]);

  await deleteIndex("to-delete");

  // After deletion the in-memory store auto-creates a fresh empty index
  const result = await search("to-delete", "");
  assert.equal(result.hits.length, 0);
});

test("indexDocuments returns correct indexed count", async () => {
  resetSearchEngine();
  const docs = makeLeadDocs(5);
  const { indexed } = await indexDocuments("leads", docs);
  assert.equal(indexed, 5);
});

test("indexDocuments returns 0 for empty array", async () => {
  resetSearchEngine();
  const { indexed } = await indexDocuments("leads", []);
  assert.equal(indexed, 0);
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

test("search returns all docs when query is empty", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(5));
  const result = await search("leads", "");
  assert.equal(result.hits.length, 5);
  assert.equal(result.estimatedTotalHits, 5);
});

test("search query filters by searchable attribute", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(10));
  const result = await search("leads", "Lead 1");
  assert.ok(result.hits.length > 0);
  assert.ok(result.hits.length < 10);
});

test("search returns correct query field in result", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(3));
  const result = await search("leads", "fitness");
  assert.equal(result.query, "fitness");
});

test("search processingTimeMs is a non-negative number", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(3));
  const result = await search("leads", "");
  assert.ok(typeof result.processingTimeMs === "number");
  assert.ok(result.processingTimeMs >= 0);
});

test("search with filters narrows results", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(10));
  const result = await search("leads", "", { filters: "niche = fitness" });
  const hits = result.hits as Record<string, unknown>[];
  assert.ok(hits.length > 0, "Should have some fitness leads");
  for (const hit of hits) {
    assert.equal(hit.niche, "fitness");
  }
});

test("search with limit restricts result count", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(20));
  const result = await search("leads", "", { limit: 5 });
  assert.equal(result.hits.length, 5);
});

test("search with offset paginates results", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(10));
  const page1 = await search<Record<string, unknown>>("leads", "", { limit: 5, offset: 0 });
  const page2 = await search<Record<string, unknown>>("leads", "", { limit: 5, offset: 5 });

  assert.equal(page1.hits.length, 5);
  assert.equal(page2.hits.length, 5);

  const page1Ids = page1.hits.map((h) => h.id);
  const page2Ids = page2.hits.map((h) => h.id);
  const overlap = page1Ids.filter((id) => page2Ids.includes(id));
  assert.equal(overlap.length, 0, "Pages should not overlap");
});

test("search with sort orders results", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(5));
  const result = await search<Record<string, unknown>>("leads", "", { sort: ["score:desc"] });
  const scores = result.hits.map((h) => Number(h.score));
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i] <= scores[i - 1], `Scores should be descending: ${scores.join(", ")}`);
  }
});

test("search with facets returns facet distribution", async () => {
  resetSearchEngine();
  await indexDocuments("leads", makeLeadDocs(10));
  const result = await search("leads", "", { facets: ["niche"] });
  assert.ok(result.facets, "facets should be returned");
  assert.ok("niche" in result.facets!, "niche facet should be present");
  const nicheFacets = result.facets!.niche;
  assert.ok("fitness" in nicheFacets, "fitness facet value should be present");
  assert.ok("finance" in nicheFacets, "finance facet value should be present");
});

test("upsert behavior: re-indexing same primaryKey updates document", async () => {
  resetSearchEngine();
  await indexDocuments("leads", [{ id: "upsert-1", name: "Original", score: 10 }]);
  await indexDocuments("leads", [{ id: "upsert-1", name: "Updated", score: 99 }]);

  const result = await search<Record<string, unknown>>("leads", "Updated");
  assert.equal(result.hits.length, 1);
  assert.equal(result.hits[0].score, 99);
});

// ---------------------------------------------------------------------------
// initializeLeadOSIndexes
// ---------------------------------------------------------------------------

test("initializeLeadOSIndexes creates all three indexes", async () => {
  resetSearchEngine();
  await initializeLeadOSIndexes();

  for (const index of LEAD_OS_INDEXES) {
    const result = await search(index.name, "");
    assert.equal(result.estimatedTotalHits, 0, `Index ${index.name} should exist and be empty`);
  }
});

// ---------------------------------------------------------------------------
// resetSearchEngine
// ---------------------------------------------------------------------------

test("resetSearchEngine clears all indexed documents", async () => {
  await indexDocuments("leads", makeLeadDocs(5));
  resetSearchEngine();

  const result = await search("leads", "");
  assert.equal(result.hits.length, 0);
});

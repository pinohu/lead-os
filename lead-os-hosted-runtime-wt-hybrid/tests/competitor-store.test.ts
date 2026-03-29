import test from "node:test";
import assert from "node:assert/strict";
import {
  addCompetitor,
  getCompetitor,
  listCompetitors,
  updateCompetitor,
  removeCompetitor,
  addSnapshot,
  listSnapshots,
  getLatestSnapshot,
  resetCompetitorStore,
  type TrackedCompetitor,
  type CompetitorSnapshot,
} from "../src/lib/competitor-store.ts";

function makeCompetitor(overrides: Partial<TrackedCompetitor> = {}): TrackedCompetitor {
  const now = new Date().toISOString();
  return {
    id: `comp_test_${Math.random().toString(36).slice(2, 9)}`,
    tenantId: "tenant-a",
    url: "https://example.com",
    name: "Example Competitor",
    scrapeCount: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSnapshot(competitorId: string, overrides: Partial<CompetitorSnapshot> = {}): CompetitorSnapshot {
  return {
    id: `snap_test_${Math.random().toString(36).slice(2, 9)}`,
    competitorId,
    tenantId: "tenant-a",
    scrapedAt: new Date().toISOString(),
    colorCount: 3,
    sectionCount: 5,
    headlineCount: 8,
    ctaCount: 2,
    hasChat: false,
    hasBooking: true,
    hasPricing: true,
    hasTestimonials: false,
    confidence: 50,
    summary: "Test competitor — 5 sections, 8 headings, 2 CTAs.",
    ...overrides,
  };
}

// Reset in-memory state before each test group to keep tests isolated
test("competitor-store: setup", () => {
  resetCompetitorStore();
});

// ---------------------------------------------------------------------------
// addCompetitor
// ---------------------------------------------------------------------------

test("addCompetitor creates and returns competitor with generated fields", async () => {
  resetCompetitorStore();

  const input = makeCompetitor({ id: "comp_add_test_001" });
  const result = await addCompetitor(input);

  assert.equal(result.id, "comp_add_test_001");
  assert.equal(result.name, "Example Competitor");
  assert.equal(result.url, "https://example.com");
  assert.equal(result.tenantId, "tenant-a");
  assert.equal(result.status, "active");
  assert.equal(result.scrapeCount, 0);
});

test("addCompetitor returns the same object it stored", async () => {
  resetCompetitorStore();

  const input = makeCompetitor({ id: "comp_roundtrip_001", name: "Roundtrip Corp" });
  await addCompetitor(input);

  const retrieved = await getCompetitor("comp_roundtrip_001");
  assert.ok(retrieved, "Expected competitor to exist after add");
  assert.equal(retrieved.name, "Roundtrip Corp");
});

// ---------------------------------------------------------------------------
// getCompetitor
// ---------------------------------------------------------------------------

test("getCompetitor returns undefined for unknown id", async () => {
  resetCompetitorStore();

  const result = await getCompetitor("does_not_exist");
  assert.equal(result, undefined);
});

test("getCompetitor returns stored competitor by id", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_get_001", name: "Get Me Corp" });
  await addCompetitor(competitor);

  const result = await getCompetitor("comp_get_001");
  assert.ok(result);
  assert.equal(result.id, "comp_get_001");
  assert.equal(result.name, "Get Me Corp");
});

// ---------------------------------------------------------------------------
// listCompetitors
// ---------------------------------------------------------------------------

test("listCompetitors filters by tenantId", async () => {
  resetCompetitorStore();

  await addCompetitor(makeCompetitor({ id: "comp_list_a1", tenantId: "tenant-a" }));
  await addCompetitor(makeCompetitor({ id: "comp_list_a2", tenantId: "tenant-a" }));
  await addCompetitor(makeCompetitor({ id: "comp_list_b1", tenantId: "tenant-b" }));

  const tenantAResults = await listCompetitors("tenant-a");
  const tenantBResults = await listCompetitors("tenant-b");
  const noResults = await listCompetitors("tenant-c");

  assert.equal(tenantAResults.length, 2);
  assert.equal(tenantBResults.length, 1);
  assert.equal(noResults.length, 0);
});

test("listCompetitors returns competitors sorted by createdAt descending", async () => {
  resetCompetitorStore();

  const older = makeCompetitor({
    id: "comp_sort_old",
    tenantId: "tenant-sort",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  });
  const newer = makeCompetitor({
    id: "comp_sort_new",
    tenantId: "tenant-sort",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  });

  await addCompetitor(older);
  await addCompetitor(newer);

  const results = await listCompetitors("tenant-sort");
  assert.equal(results[0].id, "comp_sort_new");
  assert.equal(results[1].id, "comp_sort_old");
});

// ---------------------------------------------------------------------------
// updateCompetitor
// ---------------------------------------------------------------------------

test("updateCompetitor modifies fields and updates updatedAt", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_update_001", name: "Original Name" });
  await addCompetitor(competitor);

  const beforeUpdate = new Date().toISOString();
  const updated = { ...competitor, name: "Updated Name", status: "paused" as const };
  const result = await updateCompetitor(updated);

  assert.equal(result.name, "Updated Name");
  assert.equal(result.status, "paused");
  assert.ok(result.updatedAt >= beforeUpdate, "updatedAt should be refreshed");

  const retrieved = await getCompetitor("comp_update_001");
  assert.ok(retrieved);
  assert.equal(retrieved.name, "Updated Name");
});

test("updateCompetitor preserves fields not included in the patch", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({
    id: "comp_update_002",
    url: "https://preserve.example.com",
    nicheSlug: "saas",
  });
  await addCompetitor(competitor);

  const patched = { ...competitor, name: "New Name Only" };
  await updateCompetitor(patched);

  const result = await getCompetitor("comp_update_002");
  assert.ok(result);
  assert.equal(result.url, "https://preserve.example.com");
  assert.equal(result.nicheSlug, "saas");
});

// ---------------------------------------------------------------------------
// removeCompetitor
// ---------------------------------------------------------------------------

test("removeCompetitor deletes the record", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_remove_001" });
  await addCompetitor(competitor);

  const beforeRemove = await getCompetitor("comp_remove_001");
  assert.ok(beforeRemove, "Should exist before removal");

  await removeCompetitor("comp_remove_001");

  const afterRemove = await getCompetitor("comp_remove_001");
  assert.equal(afterRemove, undefined);
});

test("removeCompetitor does not throw for unknown id", async () => {
  resetCompetitorStore();
  await assert.doesNotReject(() => removeCompetitor("non_existent_id"));
});

// ---------------------------------------------------------------------------
// addSnapshot
// ---------------------------------------------------------------------------

test("addSnapshot stores and returns snapshot", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_snap_001" });
  await addCompetitor(competitor);

  const snapshot = makeSnapshot("comp_snap_001", { id: "snap_001", confidence: 75 });
  const result = await addSnapshot(snapshot);

  assert.equal(result.id, "snap_001");
  assert.equal(result.competitorId, "comp_snap_001");
  assert.equal(result.confidence, 75);
});

// ---------------------------------------------------------------------------
// listSnapshots
// ---------------------------------------------------------------------------

test("listSnapshots returns snapshots for a competitor sorted by date descending", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_snaplist_001" });
  await addCompetitor(competitor);

  const snap1 = makeSnapshot("comp_snaplist_001", {
    id: "snap_list_a",
    scrapedAt: "2025-01-01T00:00:00.000Z",
  });
  const snap2 = makeSnapshot("comp_snaplist_001", {
    id: "snap_list_b",
    scrapedAt: "2025-06-01T00:00:00.000Z",
  });
  const snap3 = makeSnapshot("comp_snaplist_001", {
    id: "snap_list_c",
    scrapedAt: "2025-03-01T00:00:00.000Z",
  });

  await addSnapshot(snap1);
  await addSnapshot(snap2);
  await addSnapshot(snap3);

  const results = await listSnapshots("comp_snaplist_001");

  assert.equal(results.length, 3);
  assert.equal(results[0].id, "snap_list_b", "Most recent should be first");
  assert.equal(results[1].id, "snap_list_c");
  assert.equal(results[2].id, "snap_list_a", "Oldest should be last");
});

test("listSnapshots returns empty array for competitor with no snapshots", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_nosnap_001" });
  await addCompetitor(competitor);

  const results = await listSnapshots("comp_nosnap_001");
  assert.equal(results.length, 0);
});

test("listSnapshots respects the limit parameter", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_limit_001" });
  await addCompetitor(competitor);

  for (let i = 0; i < 5; i++) {
    await addSnapshot(
      makeSnapshot("comp_limit_001", {
        id: `snap_limit_${i}`,
        scrapedAt: new Date(2025, i, 1).toISOString(),
      }),
    );
  }

  const results = await listSnapshots("comp_limit_001", 3);
  assert.equal(results.length, 3);
});

// ---------------------------------------------------------------------------
// getLatestSnapshot
// ---------------------------------------------------------------------------

test("getLatestSnapshot returns most recent snapshot", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_latest_001" });
  await addCompetitor(competitor);

  const older = makeSnapshot("comp_latest_001", {
    id: "snap_latest_old",
    scrapedAt: "2025-01-01T00:00:00.000Z",
    summary: "Old snapshot",
  });
  const newer = makeSnapshot("comp_latest_001", {
    id: "snap_latest_new",
    scrapedAt: "2025-12-01T00:00:00.000Z",
    summary: "New snapshot",
  });

  await addSnapshot(older);
  await addSnapshot(newer);

  const result = await getLatestSnapshot("comp_latest_001");
  assert.ok(result, "Expected a snapshot to be returned");
  assert.equal(result.id, "snap_latest_new");
  assert.equal(result.summary, "New snapshot");
});

test("getLatestSnapshot returns undefined when no snapshots exist", async () => {
  resetCompetitorStore();

  const competitor = makeCompetitor({ id: "comp_nolatest_001" });
  await addCompetitor(competitor);

  const result = await getLatestSnapshot("comp_nolatest_001");
  assert.equal(result, undefined);
});

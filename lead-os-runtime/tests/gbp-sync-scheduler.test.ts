import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSyncJob,
  getSyncJob,
  listSyncJobs,
  updateSyncJob,
  deleteSyncJob,
  executeSyncJob,
  evaluateDueJobs,
  resetSyncStore,
  type GBPSyncConfig,
  type GBPSyncJob,
} from "../src/lib/gbp-sync-scheduler.ts";
import { resetLandingPageStore, saveLandingPage, generateLandingPage } from "../src/lib/landing-page-generator.ts";
import { ingestGMBListing, type GMBListingData } from "../src/lib/gmb-ingestor.ts";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseConfig: GBPSyncConfig = {
  tenantId: "tenant-test-001",
  placeId: "ChIJ_test_place_id",
  slug: "joes-plumbing-seattle",
  cronExpression: "0 */6 * * *",
  enabled: true,
};

const fullListing: GMBListingData = {
  placeId: "ChIJ_test_place_id",
  name: "Joe's Plumbing & Heating",
  address: "123 Main St",
  city: "Seattle",
  state: "WA",
  postalCode: "98101",
  country: "US",
  phone: "+1-206-555-0100",
  website: "https://joesplumbing.com",
  primaryCategory: "Plumber",
  additionalCategories: ["Water Heater Installation Service"],
  description: "Family-owned plumbing company serving Seattle since 1985.",
  rating: 4.8,
  reviewCount: 127,
  reviews: [
    { author: "John Smith", rating: 5, text: "Amazing service! Joe fixed our leaky faucet in no time. Highly recommend!", relativeTime: "2 months ago" },
    { author: "Sarah", rating: 5, text: "Very professional and affordable. Will use again.", relativeTime: "1 month ago" },
    { author: "Mike Johnson", rating: 4, text: "Good work but arrived a bit late.", relativeTime: "3 months ago" },
  ],
  photos: [
    { url: "https://example.com/storefront.jpg", category: "exterior" },
  ],
  hours: [
    { day: "monday", open: "08:00", close: "18:00" },
    { day: "tuesday", open: "08:00", close: "18:00" },
  ],
  attributes: [
    { key: "wheelchair_accessible", label: "Wheelchair Accessible", value: true },
  ],
};

const minimalListing: GMBListingData = {
  name: "Quick Fix Plumbing",
  address: "456 Oak Ave",
};

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

describe("createSyncJob", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("creates a job with correct defaults", async () => {
    const job = await createSyncJob(baseConfig);

    assert.ok(job.id);
    assert.equal(job.config.tenantId, baseConfig.tenantId);
    assert.equal(job.config.placeId, baseConfig.placeId);
    assert.equal(job.config.slug, baseConfig.slug);
    assert.equal(job.config.cronExpression, baseConfig.cronExpression);
    assert.equal(job.config.enabled, true);
    assert.equal(job.status, "idle");
    assert.equal(job.lastRunAt, null);
    assert.equal(job.lastResult, null);
    assert.equal(job.totalRuns, 0);
    assert.equal(job.consecutiveFailures, 0);
    assert.ok(job.nextRunAt);
    assert.ok(job.createdAt);
  });

  it("computes nextRunAt based on cron interval", async () => {
    const job = await createSyncJob(baseConfig);
    const nextRun = new Date(job.nextRunAt).getTime();
    const created = new Date(job.createdAt).getTime();
    const sixHoursMs = 6 * 60 * 60_000;

    assert.ok(Math.abs(nextRun - created - sixHoursMs) < 100);
  });
});

describe("getSyncJob", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("returns the job by ID", async () => {
    const job = await createSyncJob(baseConfig);
    const found = getSyncJob(job.id);

    assert.ok(found);
    assert.equal(found.id, job.id);
  });

  it("returns null for unknown ID", () => {
    const found = getSyncJob("nonexistent-id");
    assert.equal(found, null);
  });
});

describe("listSyncJobs", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("lists all jobs when no tenantId filter", async () => {
    await createSyncJob(baseConfig);
    await createSyncJob({ ...baseConfig, tenantId: "tenant-other" });

    const jobs = listSyncJobs();
    assert.equal(jobs.length, 2);
  });

  it("filters by tenantId", async () => {
    await createSyncJob(baseConfig);
    await createSyncJob({ ...baseConfig, tenantId: "tenant-other" });

    const jobs = listSyncJobs("tenant-other");
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].config.tenantId, "tenant-other");
  });

  it("returns empty array when no jobs match", () => {
    const jobs = listSyncJobs("nonexistent-tenant");
    assert.equal(jobs.length, 0);
  });
});

describe("updateSyncJob", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("updates cronExpression and recomputes nextRunAt", async () => {
    const job = await createSyncJob(baseConfig);
    const originalNextRun = job.nextRunAt;

    const updated = updateSyncJob(job.id, { cronExpression: "0 0 * * *" });

    assert.ok(updated);
    assert.equal(updated.config.cronExpression, "0 0 * * *");
    assert.notEqual(updated.nextRunAt, originalNextRun);
  });

  it("updates enabled flag", async () => {
    const job = await createSyncJob(baseConfig);
    const updated = updateSyncJob(job.id, { enabled: false });

    assert.ok(updated);
    assert.equal(updated.config.enabled, false);
  });

  it("returns null for unknown job", () => {
    const result = updateSyncJob("nonexistent", { enabled: false });
    assert.equal(result, null);
  });
});

describe("deleteSyncJob", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("deletes an existing job and returns true", async () => {
    const job = await createSyncJob(baseConfig);
    const deleted = deleteSyncJob(job.id);

    assert.equal(deleted, true);
    assert.equal(getSyncJob(job.id), null);
  });

  it("returns false for unknown job", () => {
    assert.equal(deleteSyncJob("nonexistent"), false);
  });
});

// ---------------------------------------------------------------------------
// executeSyncJob
// ---------------------------------------------------------------------------

describe("executeSyncJob", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("executes sync with full listing data", async () => {
    const job = await createSyncJob(baseConfig);
    const result = await executeSyncJob(job.id, fullListing);

    assert.equal(result.success, true);
    assert.ok(result.listingCompleteness > 0);
    assert.ok(result.reviewQuality > 0);
    assert.ok(result.sectionsUpdated > 0);
    assert.equal(result.changesDetected, true);
    assert.ok(result.durationMs >= 0);
    assert.ok(result.syncedAt);

    const updated = getSyncJob(job.id);
    assert.ok(updated);
    assert.equal(updated.status, "completed");
    assert.equal(updated.totalRuns, 1);
    assert.equal(updated.consecutiveFailures, 0);
    assert.ok(updated.lastRunAt);
    assert.ok(updated.lastResult);
  });

  it("executes sync with minimal listing data", async () => {
    const job = await createSyncJob(baseConfig);
    const result = await executeSyncJob(job.id, minimalListing);

    assert.equal(result.success, true);
    assert.ok(result.sectionsUpdated > 0);
    assert.equal(result.changesDetected, true);

    const updated = getSyncJob(job.id);
    assert.ok(updated);
    assert.equal(updated.status, "completed");
    assert.equal(updated.totalRuns, 1);
  });

  it("detects no changes when landing page is unchanged", async () => {
    const job = await createSyncJob(baseConfig);

    // First sync creates the landing page.
    await executeSyncJob(job.id, fullListing);

    // Second sync with identical data should detect no changes.
    const result = await executeSyncJob(job.id, fullListing);

    assert.equal(result.success, true);
    assert.equal(result.changesDetected, false);
    assert.equal(result.sectionsUpdated, 0);
    assert.ok(result.detail.includes("no changes"));

    const updated = getSyncJob(job.id);
    assert.ok(updated);
    assert.equal(updated.totalRuns, 2);
  });

  it("detects changes when listing data differs", async () => {
    const job = await createSyncJob(baseConfig);

    await executeSyncJob(job.id, fullListing);

    const modifiedListing: GMBListingData = {
      ...fullListing,
      rating: 4.9,
      reviewCount: 150,
      description: "Updated description for testing change detection.",
    };

    const result = await executeSyncJob(job.id, modifiedListing);

    assert.equal(result.success, true);
    assert.equal(result.changesDetected, true);
    assert.ok(result.sectionsUpdated > 0);
  });

  it("throws for unknown job ID", async () => {
    await assert.rejects(
      () => executeSyncJob("nonexistent", fullListing),
      { message: "Sync job not found: nonexistent" },
    );
  });

  it("handles ingest failure gracefully", async () => {
    const job = await createSyncJob(baseConfig);
    const badListing: GMBListingData = { name: "", address: "" };

    const result = await executeSyncJob(job.id, badListing);

    assert.equal(result.success, false);
    assert.equal(result.listingCompleteness, 0);
    assert.equal(result.reviewQuality, 0);
    assert.equal(result.sectionsUpdated, 0);
    assert.ok(result.detail.length > 0);

    const updated = getSyncJob(job.id);
    assert.ok(updated);
    assert.equal(updated.status, "failed");
    assert.equal(updated.totalRuns, 1);
    assert.equal(updated.consecutiveFailures, 1);
  });
});

// ---------------------------------------------------------------------------
// Consecutive failure tracking
// ---------------------------------------------------------------------------

describe("consecutive failure tracking", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("increments consecutiveFailures on each failure", async () => {
    const job = await createSyncJob(baseConfig);
    const badListing: GMBListingData = { name: "", address: "" };

    await executeSyncJob(job.id, badListing);
    assert.equal(getSyncJob(job.id)!.consecutiveFailures, 1);

    await executeSyncJob(job.id, badListing);
    assert.equal(getSyncJob(job.id)!.consecutiveFailures, 2);

    await executeSyncJob(job.id, badListing);
    assert.equal(getSyncJob(job.id)!.consecutiveFailures, 3);
  });

  it("resets consecutiveFailures on success after failures", async () => {
    const job = await createSyncJob(baseConfig);
    const badListing: GMBListingData = { name: "", address: "" };

    await executeSyncJob(job.id, badListing);
    await executeSyncJob(job.id, badListing);
    assert.equal(getSyncJob(job.id)!.consecutiveFailures, 2);

    await executeSyncJob(job.id, fullListing);
    assert.equal(getSyncJob(job.id)!.consecutiveFailures, 0);
    assert.equal(getSyncJob(job.id)!.totalRuns, 3);
  });
});

// ---------------------------------------------------------------------------
// evaluateDueJobs
// ---------------------------------------------------------------------------

describe("evaluateDueJobs", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("returns jobs whose nextRunAt is in the past", async () => {
    const job = await createSyncJob(baseConfig);

    // Force nextRunAt to the past.
    const stored = getSyncJob(job.id)!;
    stored.nextRunAt = new Date(Date.now() - 60_000).toISOString();

    const due = evaluateDueJobs();
    assert.equal(due.length, 1);
    assert.equal(due[0].id, job.id);
  });

  it("excludes disabled jobs", async () => {
    const job = await createSyncJob({ ...baseConfig, enabled: false });

    const stored = getSyncJob(job.id)!;
    stored.nextRunAt = new Date(Date.now() - 60_000).toISOString();

    const due = evaluateDueJobs();
    assert.equal(due.length, 0);
  });

  it("excludes running jobs", async () => {
    const job = await createSyncJob(baseConfig);

    const stored = getSyncJob(job.id)!;
    stored.nextRunAt = new Date(Date.now() - 60_000).toISOString();
    stored.status = "running";

    const due = evaluateDueJobs();
    assert.equal(due.length, 0);
  });

  it("excludes jobs whose nextRunAt is in the future", async () => {
    await createSyncJob(baseConfig);

    const due = evaluateDueJobs();
    assert.equal(due.length, 0);
  });

  it("includes completed and failed jobs that are due again", async () => {
    const job1 = await createSyncJob(baseConfig);
    const job2 = await createSyncJob({ ...baseConfig, placeId: "place-2" });

    const stored1 = getSyncJob(job1.id)!;
    stored1.status = "completed";
    stored1.nextRunAt = new Date(Date.now() - 60_000).toISOString();

    const stored2 = getSyncJob(job2.id)!;
    stored2.status = "failed";
    stored2.nextRunAt = new Date(Date.now() - 60_000).toISOString();

    const due = evaluateDueJobs();
    assert.equal(due.length, 2);
  });

  it("returns only due, enabled, non-running from a mixed set", async () => {
    // Due + enabled + idle => included
    const j1 = await createSyncJob(baseConfig);
    getSyncJob(j1.id)!.nextRunAt = new Date(Date.now() - 60_000).toISOString();

    // Due + disabled => excluded
    const j2 = await createSyncJob({ ...baseConfig, enabled: false, placeId: "p2" });
    getSyncJob(j2.id)!.nextRunAt = new Date(Date.now() - 60_000).toISOString();

    // Due + running => excluded
    const j3 = await createSyncJob({ ...baseConfig, placeId: "p3" });
    const s3 = getSyncJob(j3.id)!;
    s3.nextRunAt = new Date(Date.now() - 60_000).toISOString();
    s3.status = "running";

    // Not due => excluded
    await createSyncJob({ ...baseConfig, placeId: "p4" });

    const due = evaluateDueJobs();
    assert.equal(due.length, 1);
    assert.equal(due[0].id, j1.id);
  });
});

// ---------------------------------------------------------------------------
// Change detection between old and new landing pages
// ---------------------------------------------------------------------------

describe("change detection", () => {
  beforeEach(() => {
    resetSyncStore();
    resetLandingPageStore();
  });

  it("detects changes when sections differ in count", async () => {
    const job = await createSyncJob(baseConfig);

    // First run with full listing (many sections).
    await executeSyncJob(job.id, fullListing);

    // Second run with minimal listing (fewer sections).
    const result = await executeSyncJob(job.id, minimalListing);

    assert.equal(result.changesDetected, true);
    assert.ok(result.sectionsUpdated > 0);
  });

  it("detects changes when section content differs", async () => {
    const job = await createSyncJob(baseConfig);

    await executeSyncJob(job.id, fullListing);

    const modifiedListing: GMBListingData = {
      ...fullListing,
      phone: "+1-206-555-9999",
    };

    const result = await executeSyncJob(job.id, modifiedListing);

    assert.equal(result.changesDetected, true);
  });

  it("reports no changes for identical re-sync", async () => {
    const job = await createSyncJob(baseConfig);

    await executeSyncJob(job.id, fullListing);
    const result = await executeSyncJob(job.id, fullListing);

    assert.equal(result.changesDetected, false);
    assert.equal(result.sectionsUpdated, 0);
  });
});

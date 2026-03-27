import test from "node:test";
import assert from "node:assert/strict";
import {
  createCreativeJob,
  getCreativeJob,
  listCreativeJobs,
  updateCreativeJob,
  pauseCreativeJob,
  resumeCreativeJob,
  deleteCreativeJob,
  runCreativeJob,
  resetCreativeSchedulerStore,
  CREATIVE_JOB_TYPES,
} from "../src/lib/creative-scheduler.ts";
import { createTenant, resetTenantStore } from "../src/lib/tenant-store.ts";

let testTenantId: string;

test.beforeEach(async () => {
  resetCreativeSchedulerStore();
  resetTenantStore();
  const tenant = await createTenant({
    slug: "creative-test",
    brandName: "Creative Brand",
    siteUrl: "https://creative.example.com",
    supportEmail: "creative@example.com",
    defaultService: "consulting",
    defaultNiche: "general",
    widgetOrigins: [],
    accent: "#14b8a6",
    enabledFunnels: ["standard"],
    channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
    revenueModel: "managed",
    plan: "growth",
    status: "active",
    operatorEmails: ["admin@creative.example.com"],
    providerConfig: {},
    metadata: {},
  });
  testTenantId = tenant.tenantId;
});

// ---------------------------------------------------------------------------
// createCreativeJob
// ---------------------------------------------------------------------------

test("createCreativeJob stores job with correct fields", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "weekly-video-recap",
    schedule: "weekly",
  });

  assert.ok(job.id);
  assert.equal(job.tenantId, testTenantId);
  assert.equal(job.type, "weekly-video-recap");
  assert.equal(job.schedule, "weekly");
  assert.equal(job.status, "active");
  assert.ok(job.nextRunAt);
  assert.ok(job.createdAt);
  assert.ok(job.updatedAt);
});

test("createCreativeJob stores config", async () => {
  const config = { features: ["A", "B"] };
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "marketing-gallery-update",
    schedule: "monthly",
    config,
  });

  assert.deepEqual(job.config, config);
});

// ---------------------------------------------------------------------------
// getCreativeJob
// ---------------------------------------------------------------------------

test("getCreativeJob retrieves stored job", async () => {
  const created = await createCreativeJob({
    tenantId: testTenantId,
    type: "design-system-sync",
    schedule: "weekly",
  });

  const fetched = await getCreativeJob(created.id);
  assert.ok(fetched);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.type, "design-system-sync");
});

test("getCreativeJob returns null for nonexistent id", async () => {
  const fetched = await getCreativeJob("nonexistent-id");
  assert.equal(fetched, null);
});

// ---------------------------------------------------------------------------
// listCreativeJobs
// ---------------------------------------------------------------------------

test("listCreativeJobs returns jobs for tenant", async () => {
  await createCreativeJob({ tenantId: testTenantId, type: "weekly-video-recap", schedule: "weekly" });
  await createCreativeJob({ tenantId: testTenantId, type: "design-system-sync", schedule: "weekly" });
  await createCreativeJob({ tenantId: "other-tenant", type: "daily-metrics-video", schedule: "daily" });

  const jobs = await listCreativeJobs(testTenantId);
  assert.equal(jobs.length, 2);
  assert.ok(jobs.every((j) => j.tenantId === testTenantId));
});

test("listCreativeJobs returns empty array for tenant with no jobs", async () => {
  const jobs = await listCreativeJobs("no-jobs-tenant");
  assert.equal(jobs.length, 0);
});

// ---------------------------------------------------------------------------
// updateCreativeJob
// ---------------------------------------------------------------------------

test("updateCreativeJob updates schedule", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "daily-metrics-video",
    schedule: "daily",
  });

  const updated = await updateCreativeJob(job.id, { schedule: "weekly" });
  assert.ok(updated);
  assert.equal(updated.schedule, "weekly");
  assert.ok(updated.updatedAt);
  assert.ok(updated.nextRunAt);
});

test("updateCreativeJob returns null for nonexistent id", async () => {
  const result = await updateCreativeJob("nonexistent", { schedule: "monthly" });
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// pauseCreativeJob / resumeCreativeJob
// ---------------------------------------------------------------------------

test("pause/resume toggles status", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "weekly-video-recap",
    schedule: "weekly",
  });

  assert.equal(job.status, "active");

  const paused = await pauseCreativeJob(job.id);
  assert.ok(paused);
  assert.equal(paused.status, "paused");

  const resumed = await resumeCreativeJob(job.id);
  assert.ok(resumed);
  assert.equal(resumed.status, "active");
});

// ---------------------------------------------------------------------------
// deleteCreativeJob
// ---------------------------------------------------------------------------

test("deleteCreativeJob removes job", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "landing-page-refresh",
    schedule: "monthly",
  });

  const deleted = await deleteCreativeJob(job.id);
  assert.ok(deleted);

  const fetched = await getCreativeJob(job.id);
  assert.equal(fetched, null);
});

test("deleteCreativeJob returns false for nonexistent id", async () => {
  const deleted = await deleteCreativeJob("nonexistent");
  assert.equal(deleted, false);
});

// ---------------------------------------------------------------------------
// runCreativeJob
// ---------------------------------------------------------------------------

test("runCreativeJob returns artifacts for weekly-video-recap", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "weekly-video-recap",
    schedule: "weekly",
  });

  const output = await runCreativeJob(job.id);

  assert.equal(output.jobId, job.id);
  assert.equal(output.type, "weekly-video-recap");
  assert.ok(output.artifacts.length > 0);
  assert.ok(output.generatedAt);

  const remotionArtifact = output.artifacts.find((a) => a.type === "remotion-script");
  assert.ok(remotionArtifact);
  assert.ok(remotionArtifact.content.includes("remotion"));
  assert.equal(remotionArtifact.format, "tsx");
});

test("runCreativeJob returns artifacts for design-system-sync", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "design-system-sync",
    schedule: "weekly",
  });

  const output = await runCreativeJob(job.id);

  assert.equal(output.type, "design-system-sync");
  assert.ok(output.artifacts.length >= 2);

  const designMdArtifact = output.artifacts.find((a) => a.name === "design.md");
  assert.ok(designMdArtifact);
  assert.equal(designMdArtifact.type, "design-md");
  assert.ok(designMdArtifact.content.includes("# Design System:"));
});

test("runCreativeJob returns artifacts for daily-metrics-video", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "daily-metrics-video",
    schedule: "daily",
  });

  const output = await runCreativeJob(job.id);

  assert.ok(output.artifacts.length > 0);
  assert.ok(output.artifacts[0].type === "remotion-script");
  assert.ok(output.artifacts[0].format === "tsx");
});

test("runCreativeJob returns artifacts for email-sequence-update", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "email-sequence-update",
    schedule: "weekly",
  });

  const output = await runCreativeJob(job.id);
  assert.ok(output.artifacts.length > 0);
  assert.equal(output.artifacts[0].type, "email-template");
});

test("runCreativeJob returns artifacts for landing-page-refresh", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "landing-page-refresh",
    schedule: "monthly",
  });

  const output = await runCreativeJob(job.id);
  assert.ok(output.artifacts.length > 0);
  assert.equal(output.artifacts[0].type, "landing-page");
});

test("runCreativeJob returns artifacts for marketing-gallery-update", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "marketing-gallery-update",
    schedule: "monthly",
    config: { features: ["Scoring", "Funnels"] },
  });

  const output = await runCreativeJob(job.id);
  assert.ok(output.artifacts.length > 0);
  assert.equal(output.artifacts[0].type, "image-spec");
});

test("runCreativeJob updates lastRunAt and nextRunAt", async () => {
  const job = await createCreativeJob({
    tenantId: testTenantId,
    type: "weekly-video-recap",
    schedule: "weekly",
  });

  assert.equal(job.lastRunAt, undefined);

  await runCreativeJob(job.id);

  const updated = await getCreativeJob(job.id);
  assert.ok(updated);
  assert.ok(updated.lastRunAt);
  assert.ok(updated.nextRunAt);
  assert.ok(updated.lastOutput);
});

test("runCreativeJob throws for nonexistent job", async () => {
  await assert.rejects(
    () => runCreativeJob("nonexistent-job"),
    { message: /Creative job not found/ },
  );
});

// ---------------------------------------------------------------------------
// CREATIVE_JOB_TYPES
// ---------------------------------------------------------------------------

test("CREATIVE_JOB_TYPES includes all job types", () => {
  const types = CREATIVE_JOB_TYPES.map((t) => t.type);

  assert.ok(types.includes("weekly-video-recap"));
  assert.ok(types.includes("daily-metrics-video"));
  assert.ok(types.includes("landing-page-refresh"));
  assert.ok(types.includes("email-sequence-update"));
  assert.ok(types.includes("design-system-sync"));
  assert.ok(types.includes("marketing-gallery-update"));
  assert.equal(types.length, 6);
});

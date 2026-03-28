import test from "node:test";
import assert from "node:assert/strict";
import {
  publishPost,
  publishBatch,
  schedulePost,
  getScheduledPosts,
  cancelScheduledPost,
  getPublishHistory,
  getPostMetrics,
  generateAndPublish,
  resetPublisherStore,
  type SocialPost,
  type SocialPlatform,
} from "../src/lib/integrations/social-publisher.ts";

const ALL_PLATFORMS: SocialPlatform[] = ["tiktok", "instagram", "youtube", "facebook", "linkedin", "x", "threads"];

function makePost(platform: SocialPlatform = "tiktok", overrides: Partial<SocialPost> = {}): SocialPost {
  return {
    platform,
    content: "This is a test post about pest control.",
    hashtags: ["#pestcontrol"],
    ...overrides,
  };
}

test.beforeEach(() => {
  resetPublisherStore();
});

// ---------------------------------------------------------------------------
// publishPost
// ---------------------------------------------------------------------------

test("publishPost returns a PublishResult with required fields", async () => {
  const result = await publishPost("tenant-1", makePost("tiktok"));
  assert.ok(typeof result.id === "string" && result.id.length > 0);
  assert.equal(result.platform, "tiktok");
  assert.ok(["published", "scheduled", "failed", "dry-run"].includes(result.status));
  assert.ok(typeof result.publishedAt === "string");
});

test("publishPost returns dry-run status when Postiz is not configured", async () => {
  const result = await publishPost("tenant-1", makePost("linkedin"));
  assert.equal(result.status, "dry-run");
});

test("publishPost sets the correct platform on the result", async () => {
  for (const platform of ALL_PLATFORMS) {
    const result = await publishPost("tenant-1", makePost(platform));
    assert.equal(result.platform, platform);
  }
});

test("publishPost postUrl is a string when present", async () => {
  const result = await publishPost("tenant-1", makePost("x"));
  if (result.postUrl !== undefined) {
    assert.ok(typeof result.postUrl === "string" && result.postUrl.length > 0);
  }
});

test("publishPost publishedAt is a valid ISO 8601 date", async () => {
  const result = await publishPost("tenant-1", makePost("instagram"));
  const date = new Date(result.publishedAt);
  assert.ok(!isNaN(date.getTime()), "publishedAt must be a valid date");
});

test("publishPost adds the result to the publish history", async () => {
  await publishPost("tenant-history", makePost("tiktok"));
  const history = await getPublishHistory("tenant-history");
  assert.equal(history.length, 1);
});

// ---------------------------------------------------------------------------
// publishBatch
// ---------------------------------------------------------------------------

test("publishBatch returns one result per post", async () => {
  const posts = [makePost("tiktok"), makePost("linkedin"), makePost("instagram")];
  const results = await publishBatch("tenant-batch", posts);
  assert.equal(results.length, posts.length);
});

test("publishBatch results preserve platform order", async () => {
  const platforms: SocialPlatform[] = ["tiktok", "x", "facebook"];
  const posts = platforms.map((p) => makePost(p));
  const results = await publishBatch("tenant-batch", posts);
  for (let i = 0; i < platforms.length; i++) {
    assert.equal(results[i].platform, platforms[i]);
  }
});

// ---------------------------------------------------------------------------
// schedulePost
// ---------------------------------------------------------------------------

test("schedulePost returns a PublishResult with scheduled or dry-run status", async () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  const result = await schedulePost("tenant-sched", makePost("tiktok", { scheduledAt: futureDate }));
  assert.ok(result.status === "scheduled" || result.status === "dry-run");
});

test("schedulePost adds the post to the scheduled queue", async () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  await schedulePost("tenant-sched", makePost("tiktok", { scheduledAt: futureDate }));
  const scheduled = await getScheduledPosts("tenant-sched");
  assert.equal(scheduled.length, 1);
});

test("getScheduledPosts returns empty array for unknown tenant", async () => {
  const scheduled = await getScheduledPosts("nonexistent-tenant");
  assert.deepEqual(scheduled, []);
});

test("getScheduledPosts does not return posts for a different tenant", async () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  await schedulePost("tenant-a", makePost("tiktok", { scheduledAt: futureDate }));
  const scheduled = await getScheduledPosts("tenant-b");
  assert.deepEqual(scheduled, []);
});

// ---------------------------------------------------------------------------
// cancelScheduledPost
// ---------------------------------------------------------------------------

test("cancelScheduledPost returns true for an existing scheduled post", async () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  const result = await schedulePost("tenant-cancel", makePost("tiktok", { scheduledAt: futureDate }));
  const cancelled = await cancelScheduledPost(result.id);
  assert.equal(cancelled, true);
});

test("cancelScheduledPost removes the post from the scheduled queue", async () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  const result = await schedulePost("tenant-cancel2", makePost("tiktok", { scheduledAt: futureDate }));
  await cancelScheduledPost(result.id);
  const scheduled = await getScheduledPosts("tenant-cancel2");
  assert.equal(scheduled.length, 0);
});

test("cancelScheduledPost returns false for an unknown post ID", async () => {
  const cancelled = await cancelScheduledPost("nonexistent-post-id");
  assert.equal(cancelled, false);
});

// ---------------------------------------------------------------------------
// getPublishHistory
// ---------------------------------------------------------------------------

test("getPublishHistory returns posts in reverse-chronological order (newest first)", async () => {
  await publishPost("tenant-hist", makePost("tiktok"));
  await publishPost("tenant-hist", makePost("linkedin"));
  const history = await getPublishHistory("tenant-hist");
  assert.equal(history.length, 2);
  const t1 = new Date(history[0].publishedAt).getTime();
  const t2 = new Date(history[1].publishedAt).getTime();
  assert.ok(t1 >= t2, "History should be newest first");
});

test("getPublishHistory filters by platform when provided", async () => {
  await publishPost("tenant-filter", makePost("tiktok"));
  await publishPost("tenant-filter", makePost("linkedin"));
  const tiktokHistory = await getPublishHistory("tenant-filter", "tiktok");
  assert.equal(tiktokHistory.length, 1);
  assert.equal(tiktokHistory[0].platform, "tiktok");
});

test("getPublishHistory respects the limit parameter", async () => {
  for (let i = 0; i < 5; i++) {
    await publishPost("tenant-limit", makePost("tiktok"));
  }
  const history = await getPublishHistory("tenant-limit", undefined, 3);
  assert.equal(history.length, 3);
});

// ---------------------------------------------------------------------------
// getPostMetrics
// ---------------------------------------------------------------------------

test("getPostMetrics returns null for unknown post when Postiz is not configured", async () => {
  const metrics = await getPostMetrics("unknown-post-id");
  assert.equal(metrics, null);
});

// ---------------------------------------------------------------------------
// generateAndPublish
// ---------------------------------------------------------------------------

test("generateAndPublish returns one result per platform", async () => {
  const platforms: SocialPlatform[] = ["tiktok", "linkedin", "instagram"];
  const results = await generateAndPublish("tenant-gen", "pest control tips", "pest-control", platforms);
  assert.equal(results.length, platforms.length);
});

test("generateAndPublish results have correct platform assignments", async () => {
  const platforms: SocialPlatform[] = ["tiktok", "x"];
  const results = await generateAndPublish("tenant-gen2", "roofing tips", "roofing", platforms);
  assert.equal(results[0].platform, "tiktok");
  assert.equal(results[1].platform, "x");
});

test("generateAndPublish adds all results to publish history", async () => {
  const platforms: SocialPlatform[] = ["tiktok", "linkedin"];
  await generateAndPublish("tenant-gen3", "insurance tips", "insurance", platforms);
  const history = await getPublishHistory("tenant-gen3");
  assert.ok(history.length >= platforms.length);
});

// ---------------------------------------------------------------------------
// resetPublisherStore
// ---------------------------------------------------------------------------

test("resetPublisherStore clears all history and scheduled posts", async () => {
  const futureDate = new Date(Date.now() + 3_600_000).toISOString();
  await publishPost("tenant-reset", makePost("tiktok"));
  await schedulePost("tenant-reset", makePost("tiktok", { scheduledAt: futureDate }));

  resetPublisherStore();

  const history = await getPublishHistory("tenant-reset");
  const scheduled = await getScheduledPosts("tenant-reset");
  assert.deepEqual(history, []);
  assert.deepEqual(scheduled, []);
});

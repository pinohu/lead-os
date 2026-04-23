import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveVistaSocialConfig,
  isVistaSocialDryRun,
  connectProfile,
  listProfiles,
  schedulePost,
  publishPostNow,
  getPost,
  listPosts,
  deletePost,
  getPostPerformance,
  getContentCalendar,
  getAnalytics,
  distributeCopilotContent,
  postVistaResult,
  resetVistaSocialStore,
} from "../src/lib/integrations/vista-social-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearVistaEnv() {
  delete process.env.VISTA_SOCIAL_API_KEY;
  delete process.env.VISTA_SOCIAL_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveVistaSocialConfig returns null when no API key", () => {
  clearVistaEnv();
  const cfg = resolveVistaSocialConfig();
  assert.equal(cfg, null);
});

test("resolveVistaSocialConfig returns config when API key is set", () => {
  clearVistaEnv();
  process.env.VISTA_SOCIAL_API_KEY = "test-key-123";
  const cfg = resolveVistaSocialConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key-123");
  assert.equal(cfg.baseUrl, "https://api.vistasocial.com/v1");
  clearVistaEnv();
});

test("resolveVistaSocialConfig uses custom base URL", () => {
  clearVistaEnv();
  process.env.VISTA_SOCIAL_API_KEY = "key";
  process.env.VISTA_SOCIAL_BASE_URL = "https://custom.vista.io/v2";
  const cfg = resolveVistaSocialConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.vista.io/v2");
  clearVistaEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isVistaSocialDryRun returns true when no API key", () => {
  clearVistaEnv();
  assert.equal(isVistaSocialDryRun(), true);
});

test("isVistaSocialDryRun returns false when API key is set", () => {
  clearVistaEnv();
  process.env.VISTA_SOCIAL_API_KEY = "live-key";
  assert.equal(isVistaSocialDryRun(), false);
  clearVistaEnv();
});

// ---------------------------------------------------------------------------
// Profile connection and listing
// ---------------------------------------------------------------------------

test("connectProfile creates a social profile in dry-run", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const profile = await connectProfile("twitter", "@leadgen");
  assert.ok(profile.id.startsWith("vsp-"));
  assert.equal(profile.platform, "twitter");
  assert.equal(profile.handle, "@leadgen");
  assert.equal(profile.connected, true);
  assert.equal(profile.followers, 0);
});

test("connectProfile stores tenant ID", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const profile = await connectProfile("linkedin", "company-page", "tenant-1");
  assert.equal(profile.tenantId, "tenant-1");
});

test("listProfiles returns all profiles when no tenantId", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await connectProfile("facebook", "page1", "t1");
  await connectProfile("instagram", "ig-handle", "t2");

  const all = await listProfiles();
  assert.equal(all.length, 2);
});

test("listProfiles filters by tenantId", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await connectProfile("facebook", "page1", "t1");
  await connectProfile("instagram", "ig-handle", "t2");
  await connectProfile("twitter", "tw-handle", "t1");

  const t1 = await listProfiles("t1");
  assert.equal(t1.length, 2);
  assert.ok(t1.every((p) => p.tenantId === "t1"));
});

// ---------------------------------------------------------------------------
// Schedule post
// ---------------------------------------------------------------------------

test("schedulePost creates a post with scheduled status", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["prof-1"],
    content: "Check out our new product!",
    scheduledAt: future,
    platforms: ["facebook"],
    tenantId: "t1",
  });

  assert.ok(post.id.startsWith("vspost-"));
  assert.equal(post.status, "scheduled");
  assert.equal(post.content, "Check out our new product!");
  assert.equal(post.scheduledAt, future);
  assert.deepEqual(post.platforms, ["facebook"]);
  assert.equal(post.tenantId, "t1");
});

test("schedulePost supports multiple platforms", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["prof-1", "prof-2"],
    content: "Multi-platform launch!",
    scheduledAt: future,
    platforms: ["facebook", "twitter", "linkedin"],
  });

  assert.deepEqual(post.platforms, ["facebook", "twitter", "linkedin"]);
  assert.equal(post.profileIds.length, 2);
});

test("schedulePost includes media URLs when provided", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["prof-1"],
    content: "Visual content",
    mediaUrls: ["https://cdn.example.com/img.jpg"],
    scheduledAt: future,
    platforms: ["instagram"],
  });

  assert.deepEqual(post.mediaUrls, ["https://cdn.example.com/img.jpg"]);
});

// ---------------------------------------------------------------------------
// Publish now
// ---------------------------------------------------------------------------

test("publishPostNow creates a post with published status", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const post = await publishPostNow({
    profileIds: ["prof-1"],
    content: "Breaking news!",
    platforms: ["twitter"],
  });

  assert.equal(post.status, "published");
  assert.ok(post.publishedAt);
  assert.ok(!post.scheduledAt);
});

// ---------------------------------------------------------------------------
// Post retrieval and listing
// ---------------------------------------------------------------------------

test("getPost returns post by ID", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const created = await publishPostNow({
    profileIds: ["prof-1"],
    content: "Test post",
    platforms: ["facebook"],
  });

  const found = await getPost(created.id);
  assert.ok(found);
  assert.equal(found.id, created.id);
  assert.equal(found.content, "Test post");
});

test("getPost returns undefined for non-existent ID", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const found = await getPost("non-existent-id");
  assert.equal(found, undefined);
});

test("listPosts returns all posts when no filters", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await publishPostNow({ profileIds: ["p1"], content: "A", platforms: ["facebook"], tenantId: "t1" });
  await publishPostNow({ profileIds: ["p2"], content: "B", platforms: ["twitter"], tenantId: "t2" });

  const all = await listPosts();
  assert.equal(all.length, 2);
});

test("listPosts filters by tenantId", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await publishPostNow({ profileIds: ["p1"], content: "A", platforms: ["facebook"], tenantId: "t1" });
  await publishPostNow({ profileIds: ["p2"], content: "B", platforms: ["twitter"], tenantId: "t2" });

  const t1Posts = await listPosts("t1");
  assert.equal(t1Posts.length, 1);
  assert.equal(t1Posts[0].tenantId, "t1");
});

test("listPosts filters by status", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await publishPostNow({ profileIds: ["p1"], content: "A", platforms: ["facebook"] });
  const future = new Date(Date.now() + 86400_000).toISOString();
  await schedulePost({ profileIds: ["p2"], content: "B", scheduledAt: future, platforms: ["twitter"] });

  const published = await listPosts(undefined, "published");
  assert.equal(published.length, 1);
  assert.equal(published[0].status, "published");

  const scheduled = await listPosts(undefined, "scheduled");
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].status, "scheduled");
});

// ---------------------------------------------------------------------------
// Post deletion
// ---------------------------------------------------------------------------

test("deletePost removes a draft post", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["p1"],
    content: "Draft content",
    scheduledAt: future,
    platforms: ["facebook"],
  });

  const deleted = await deletePost(post.id);
  assert.equal(deleted, true);

  const found = await getPost(post.id);
  assert.equal(found, undefined);
});

test("deletePost removes a scheduled post", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["p1"],
    content: "Scheduled content",
    scheduledAt: future,
    platforms: ["twitter"],
  });

  const deleted = await deletePost(post.id);
  assert.equal(deleted, true);
});

test("deletePost rejects deletion of published posts", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const post = await publishPostNow({
    profileIds: ["p1"],
    content: "Published content",
    platforms: ["linkedin"],
  });

  const deleted = await deletePost(post.id);
  assert.equal(deleted, false);

  const found = await getPost(post.id);
  assert.ok(found);
});

test("deletePost returns false for non-existent post", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const deleted = await deletePost("non-existent");
  assert.equal(deleted, false);
});

// ---------------------------------------------------------------------------
// Performance metrics (dry-run generated)
// ---------------------------------------------------------------------------

test("getPostPerformance returns metrics for existing post", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const post = await publishPostNow({
    profileIds: ["p1"],
    content: "Measure me",
    platforms: ["instagram"],
  });

  const perf = await getPostPerformance(post.id);
  assert.ok(perf);
  assert.equal(perf.postId, post.id);
  assert.ok(perf.impressions > 0);
  assert.ok(perf.reach > 0);
  assert.ok(perf.likes >= 0);
  assert.ok(perf.comments >= 0);
  assert.ok(perf.shares >= 0);
  assert.ok(perf.clicks >= 0);
  assert.ok(perf.engagementRate > 0);
});

test("getPostPerformance returns null for non-existent post", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const perf = await getPostPerformance("non-existent");
  assert.equal(perf, null);
});

test("getPostPerformance returns higher engagement for TikTok than Pinterest", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const tiktokPost = await publishPostNow({
    profileIds: ["p1"],
    content: "TikTok content",
    platforms: ["tiktok"],
  });
  const pinterestPost = await publishPostNow({
    profileIds: ["p2"],
    content: "Pinterest content",
    platforms: ["pinterest"],
  });

  const tiktokPerf = await getPostPerformance(tiktokPost.id);
  const pinterestPerf = await getPostPerformance(pinterestPost.id);
  assert.ok(tiktokPerf);
  assert.ok(pinterestPerf);
  assert.ok(tiktokPerf.impressions > pinterestPerf.impressions);
});

test("getPostPerformance caches results on subsequent calls", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const post = await publishPostNow({
    profileIds: ["p1"],
    content: "Cache test",
    platforms: ["facebook"],
  });

  const perf1 = await getPostPerformance(post.id);
  const perf2 = await getPostPerformance(post.id);
  assert.deepEqual(perf1, perf2);
});

// ---------------------------------------------------------------------------
// Content calendar
// ---------------------------------------------------------------------------

test("getContentCalendar returns entries for date range", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await schedulePost({
    profileIds: ["p1"],
    content: "Tomorrow post",
    scheduledAt: tomorrow.toISOString(),
    platforms: ["facebook"],
  });

  const startStr = today.toISOString().slice(0, 10);
  const endStr = tomorrow.toISOString().slice(0, 10);
  const calendar = await getContentCalendar(startStr, endStr);

  assert.ok(calendar.length >= 1);
  const hasPost = calendar.some((entry) => entry.posts.length > 0);
  assert.ok(hasPost);
});

test("getContentCalendar returns empty posts array for days without posts", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const calendar = await getContentCalendar("2025-01-01", "2025-01-03");
  assert.equal(calendar.length, 3);
  assert.ok(calendar.every((entry) => entry.posts.length === 0));
});

test("getContentCalendar filters by tenantId", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await schedulePost({
    profileIds: ["p1"],
    content: "Tenant 1 post",
    scheduledAt: tomorrow.toISOString(),
    platforms: ["facebook"],
    tenantId: "t1",
  });
  await schedulePost({
    profileIds: ["p2"],
    content: "Tenant 2 post",
    scheduledAt: tomorrow.toISOString(),
    platforms: ["twitter"],
    tenantId: "t2",
  });

  const today = new Date();
  const startStr = today.toISOString().slice(0, 10);
  const endStr = tomorrow.toISOString().slice(0, 10);
  const calendar = await getContentCalendar(startStr, endStr, "t1");

  const totalPosts = calendar.reduce((sum, e) => sum + e.posts.length, 0);
  assert.equal(totalPosts, 1);
});

// ---------------------------------------------------------------------------
// Analytics computation
// ---------------------------------------------------------------------------

test("getAnalytics computes aggregate metrics", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await publishPostNow({ profileIds: ["p1"], content: "Post 1", platforms: ["facebook"] });
  await publishPostNow({ profileIds: ["p2"], content: "Post 2", platforms: ["instagram"] });
  await publishPostNow({ profileIds: ["p3"], content: "Post 3", platforms: ["twitter"] });

  const analytics = await getAnalytics();
  assert.equal(analytics.totalPosts, 3);
  assert.ok(analytics.totalImpressions > 0);
  assert.ok(analytics.totalEngagement > 0);
  assert.ok(analytics.avgEngagementRate > 0);
  assert.ok(analytics.topPlatform);
  assert.ok(analytics.topPost);
  assert.ok(analytics.byPlatform.facebook.posts >= 1);
  assert.ok(analytics.byPlatform.instagram.posts >= 1);
  assert.ok(analytics.byPlatform.twitter.posts >= 1);
});

test("getAnalytics returns zeros when no posts exist", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const analytics = await getAnalytics();
  assert.equal(analytics.totalPosts, 0);
  assert.equal(analytics.totalImpressions, 0);
  assert.equal(analytics.totalEngagement, 0);
  assert.equal(analytics.avgEngagementRate, 0);
});

test("getAnalytics filters by tenantId", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await publishPostNow({ profileIds: ["p1"], content: "T1", platforms: ["facebook"], tenantId: "t1" });
  await publishPostNow({ profileIds: ["p2"], content: "T2", platforms: ["twitter"], tenantId: "t2" });

  const t1Analytics = await getAnalytics("t1");
  assert.equal(t1Analytics.totalPosts, 1);
});

// ---------------------------------------------------------------------------
// Content distribution with platform-specific adaptation
// ---------------------------------------------------------------------------

test("distributeCopilotContent creates posts for each platform", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await connectProfile("facebook", "my-page", "t1");
  await connectProfile("twitter", "@myhandle", "t1");

  const posts = await distributeCopilotContent(
    "This is great content for social media!",
    ["facebook", "twitter"],
    "t1",
  );

  assert.equal(posts.length, 2);
  assert.ok(posts[0].platforms.includes("facebook") || posts[0].platforms.includes("twitter"));
});

test("distributeCopilotContent truncates content for Twitter at 280 chars", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const longContent = "A".repeat(300);
  const posts = await distributeCopilotContent(longContent, ["twitter"]);

  assert.equal(posts.length, 1);
  assert.ok(posts[0].content.length <= 280);
  assert.ok(posts[0].content.endsWith("..."));
});

test("distributeCopilotContent preserves full content for LinkedIn under 3000 chars", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const content = "A".repeat(2500);
  const posts = await distributeCopilotContent(content, ["linkedin"]);

  assert.equal(posts.length, 1);
  assert.equal(posts[0].content.length, 2500);
});

test("distributeCopilotContent truncates content for Pinterest at 500 chars", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const longContent = "B".repeat(600);
  const posts = await distributeCopilotContent(longContent, ["pinterest"]);

  assert.equal(posts.length, 1);
  assert.ok(posts[0].content.length <= 500);
  assert.ok(posts[0].content.endsWith("..."));
});

test("distributeCopilotContent uses auto profile IDs when no profiles exist", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const posts = await distributeCopilotContent("Content!", ["youtube"]);
  assert.equal(posts.length, 1);
  assert.ok(posts[0].profileIds[0].startsWith("auto-"));
});

// ---------------------------------------------------------------------------
// ProviderResult format
// ---------------------------------------------------------------------------

test("postVistaResult returns correct ProviderResult in dry-run", () => {
  clearVistaEnv();

  const result = postVistaResult("schedule", "Post scheduled (dry-run)");
  assert.equal(result.ok, true);
  assert.equal(result.provider, "VistaSocial");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "Post scheduled (dry-run)");
  assert.deepEqual(result.payload, { operation: "schedule" });
});

test("postVistaResult returns live mode when API key is set", () => {
  clearVistaEnv();
  process.env.VISTA_SOCIAL_API_KEY = "live-key";

  const result = postVistaResult("publish", "Post published");
  assert.equal(result.mode, "live");

  clearVistaEnv();
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("schedulePost handles empty content", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["p1"],
    content: "",
    scheduledAt: future,
    platforms: ["facebook"],
  });

  assert.equal(post.content, "");
  assert.equal(post.status, "scheduled");
});

test("distributeCopilotContent handles empty content", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const posts = await distributeCopilotContent("", ["twitter"]);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].content, "");
});

test("distributeCopilotContent handles no platforms", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const posts = await distributeCopilotContent("Content!", []);
  assert.equal(posts.length, 0);
});

// ---------------------------------------------------------------------------
// Store and reset
// ---------------------------------------------------------------------------

test("resetVistaSocialStore clears all stores", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  await connectProfile("facebook", "page1");
  await publishPostNow({ profileIds: ["p1"], content: "Post", platforms: ["facebook"] });

  let profiles = await listProfiles();
  let posts = await listPosts();
  assert.ok(profiles.length > 0);
  assert.ok(posts.length > 0);

  resetVistaSocialStore();

  profiles = await listProfiles();
  posts = await listPosts();
  assert.equal(profiles.length, 0);
  assert.equal(posts.length, 0);
});

test("deletePost also removes performance data", async () => {
  clearVistaEnv();
  resetVistaSocialStore();

  const future = new Date(Date.now() + 86400_000).toISOString();
  const post = await schedulePost({
    profileIds: ["p1"],
    content: "Performance test",
    scheduledAt: future,
    platforms: ["facebook"],
  });

  // Generate performance data
  await getPostPerformance(post.id);

  // Delete the post
  await deletePost(post.id);

  // Performance should be gone too
  const perf = await getPostPerformance(post.id);
  assert.equal(perf, null);
});

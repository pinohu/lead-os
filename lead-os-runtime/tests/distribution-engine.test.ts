import test from "node:test";
import assert from "node:assert/strict";
import {
  generateSeoPage,
  listSeoPages,
  generateProgrammaticPages,
  listProgrammaticPages,
  buildSitemap,
  generateRobotsTxt,
  generateBlogOutline,
  listBlogOutlines,
  generateSocialPosts,
  scheduleContent,
  listContentSchedules,
  trackDistributionMetric,
  getDistributionReport,
  getTopPerformingContent,
  resetDistributionStore,
  type SeoPage,
  type ProgrammaticPage,
  type BlogOutline,
  type SocialPost,
  type ContentSchedule,
  type DistributionMetric,
  type DistributionReport,
} from "../src/lib/distribution-engine.ts";

test.beforeEach(() => {
  resetDistributionStore();
});

// ---------------------------------------------------------------------------
// SEO Factory — generateSeoPage
// ---------------------------------------------------------------------------

test("generateSeoPage returns page with all required fields", async () => {
  const page = await generateSeoPage("plumbing", "emergency plumber");

  assert.ok(page.id);
  assert.equal(page.niche, "plumbing");
  assert.equal(page.keyword, "emergency plumber");
  assert.equal(page.template, "standard");
  assert.ok(page.title.includes("Emergency Plumber"));
  assert.ok(page.metaDescription.length > 0);
  assert.ok(page.h1.length > 0);
  assert.ok(page.bodySections.length >= 3);
  assert.ok(page.schemaMarkup["@context"]);
  assert.ok(page.createdAt);
});

test("generateSeoPage uses custom template", async () => {
  const page = await generateSeoPage("dental", "teeth whitening", "landing");

  assert.equal(page.template, "landing");
  assert.equal(page.niche, "dental");
});

test("generateSeoPage creates proper schema markup", async () => {
  const page = await generateSeoPage("hvac", "ac repair");

  assert.equal(page.schemaMarkup["@context"], "https://schema.org");
  assert.equal(page.schemaMarkup["@type"], "Service");
  assert.ok((page.schemaMarkup as Record<string, unknown>).serviceType);
});

test("listSeoPages returns generated pages", async () => {
  await generateSeoPage("plumbing", "drain cleaning");
  await generateSeoPage("plumbing", "pipe repair");

  const pages = listSeoPages();
  assert.equal(pages.length, 2);
});

// ---------------------------------------------------------------------------
// SEO Factory — generateProgrammaticPages
// ---------------------------------------------------------------------------

test("generateProgrammaticPages creates pages for all locations", async () => {
  const locations = ["Austin TX", "Dallas TX", "Houston TX"];
  const pages = await generateProgrammaticPages("plumbing", locations);

  assert.equal(pages.length, 3);
  assert.ok(pages[0].title.includes("Austin TX"));
  assert.ok(pages[1].title.includes("Dallas TX"));
  assert.ok(pages[2].title.includes("Houston TX"));
});

test("generateProgrammaticPages creates correct slugs", async () => {
  const pages = await generateProgrammaticPages("roofing", ["San Francisco CA"]);

  assert.equal(pages[0].slug, "roofing-in-san-francisco-ca");
});

test("generateProgrammaticPages includes LocalBusiness schema", async () => {
  const pages = await generateProgrammaticPages("electrician", ["Miami FL"]);

  assert.equal(pages[0].schemaMarkup["@type"], "LocalBusiness");
});

test("listProgrammaticPages returns all generated pages", async () => {
  await generateProgrammaticPages("plumbing", ["Austin TX", "Dallas TX"]);
  await generateProgrammaticPages("hvac", ["Denver CO"]);

  const all = listProgrammaticPages();
  assert.equal(all.length, 3);
});

// ---------------------------------------------------------------------------
// SEO Factory — buildSitemap
// ---------------------------------------------------------------------------

test("buildSitemap generates valid XML sitemap", () => {
  const pages = [
    { slug: "plumbing-in-austin-tx" },
    { slug: "plumbing-in-dallas-tx", updatedAt: "2026-01-15" },
  ];

  const sitemap = buildSitemap(pages);

  assert.ok(sitemap.startsWith('<?xml version="1.0"'));
  assert.ok(sitemap.includes("<urlset"));
  assert.ok(sitemap.includes("plumbing-in-austin-tx"));
  assert.ok(sitemap.includes("plumbing-in-dallas-tx"));
  assert.ok(sitemap.includes("<lastmod>2026-01-15</lastmod>"));
  assert.ok(sitemap.includes("</urlset>"));
});

test("buildSitemap handles empty pages array", () => {
  const sitemap = buildSitemap([]);

  assert.ok(sitemap.includes("<urlset"));
  assert.ok(sitemap.includes("</urlset>"));
});

// ---------------------------------------------------------------------------
// SEO Factory — generateRobotsTxt
// ---------------------------------------------------------------------------

test("generateRobotsTxt includes sitemap reference", () => {
  const robots = generateRobotsTxt("https://example.com");

  assert.ok(robots.includes("User-agent: *"));
  assert.ok(robots.includes("Allow: /"));
  assert.ok(robots.includes("Disallow: /api/"));
  assert.ok(robots.includes("Sitemap: https://example.com/sitemap.xml"));
});

// ---------------------------------------------------------------------------
// Content Engine — generateBlogOutline
// ---------------------------------------------------------------------------

test("generateBlogOutline returns structured outline", async () => {
  const outline = await generateBlogOutline("marketing", "email automation", "email automation tool");

  assert.ok(outline.id);
  assert.equal(outline.niche, "marketing");
  assert.equal(outline.topic, "email automation");
  assert.equal(outline.targetKeyword, "email automation tool");
  assert.ok(outline.headings.length >= 6);
  assert.equal(outline.targetWordCount, 1500);
  assert.ok(outline.internalLinkSuggestions.length > 0);
});

test("generateBlogOutline includes h2 and h3 headings", async () => {
  const outline = await generateBlogOutline("seo", "link building", "backlink strategy");

  const h2s = outline.headings.filter((h) => h.level === "h2");
  const h3s = outline.headings.filter((h) => h.level === "h3");

  assert.ok(h2s.length >= 3);
  assert.ok(h3s.length >= 3);
});

test("listBlogOutlines returns generated outlines", async () => {
  await generateBlogOutline("marketing", "seo basics", "seo guide");
  await generateBlogOutline("marketing", "ppc tips", "ppc strategy");

  const outlines = listBlogOutlines();
  assert.equal(outlines.length, 2);
});

// ---------------------------------------------------------------------------
// Content Engine — generateSocialPosts
// ---------------------------------------------------------------------------

test("generateSocialPosts creates posts for each platform", async () => {
  const contentPiece = { id: "blog-1", title: "10 SEO Tips", summary: "A guide to improving your search rankings." };
  const posts = await generateSocialPosts("marketing", contentPiece, ["twitter", "linkedin", "instagram"]);

  assert.equal(posts.length, 3);
  assert.ok(posts.find((p) => p.platform === "twitter"));
  assert.ok(posts.find((p) => p.platform === "linkedin"));
  assert.ok(posts.find((p) => p.platform === "instagram"));
});

test("generateSocialPosts respects Twitter character limit", async () => {
  const contentPiece = { id: "blog-2", title: "A Very Long Title", summary: "x".repeat(300) };
  const posts = await generateSocialPosts("marketing", contentPiece, ["twitter"]);

  assert.ok(posts[0].content.length <= 280);
  assert.equal(posts[0].characterLimit, 280);
});

test("generateSocialPosts respects LinkedIn character limit", async () => {
  const contentPiece = { id: "blog-3", title: "Title", summary: "x".repeat(1500) };
  const posts = await generateSocialPosts("marketing", contentPiece, ["linkedin"]);

  assert.ok(posts[0].content.length <= 1300);
  assert.equal(posts[0].characterLimit, 1300);
});

test("generateSocialPosts includes source content reference", async () => {
  const contentPiece = { id: "blog-4", title: "SEO Guide", summary: "Learn SEO." };
  const posts = await generateSocialPosts("marketing", contentPiece, ["twitter"]);

  assert.equal(posts[0].sourceContentId, "blog-4");
});

// ---------------------------------------------------------------------------
// Content Engine — scheduleContent
// ---------------------------------------------------------------------------

test("scheduleContent stores content with publish dates", async () => {
  const plan = [
    { contentType: "blog" as const, contentId: "blog-1", title: "Blog Post 1", publishAt: "2026-04-01T10:00:00Z" },
    { contentType: "social" as const, contentId: "social-1", title: "Tweet 1", publishAt: "2026-04-02T12:00:00Z" },
  ];

  const schedules = await scheduleContent("tenant-1", plan);

  assert.equal(schedules.length, 2);
  assert.equal(schedules[0].status, "scheduled");
  assert.equal(schedules[0].tenantId, "tenant-1");
  assert.equal(schedules[0].contentType, "blog");
  assert.equal(schedules[1].contentType, "social");
});

test("listContentSchedules filters by tenant", async () => {
  await scheduleContent("tenant-1", [
    { contentType: "blog", contentId: "b1", title: "Blog 1", publishAt: "2026-04-01T10:00:00Z" },
  ]);
  await scheduleContent("tenant-2", [
    { contentType: "blog", contentId: "b2", title: "Blog 2", publishAt: "2026-04-02T10:00:00Z" },
  ]);

  const t1 = listContentSchedules("tenant-1");
  const t2 = listContentSchedules("tenant-2");

  assert.equal(t1.length, 1);
  assert.equal(t2.length, 1);
  assert.equal(t1[0].title, "Blog 1");
  assert.equal(t2[0].title, "Blog 2");
});

// ---------------------------------------------------------------------------
// Distribution Analytics — trackDistributionMetric
// ---------------------------------------------------------------------------

test("trackDistributionMetric records metric", async () => {
  const metric = await trackDistributionMetric("tenant-1", "seo", "traffic", 1500);

  assert.ok(metric.id);
  assert.equal(metric.tenantId, "tenant-1");
  assert.equal(metric.channel, "seo");
  assert.equal(metric.metric, "traffic");
  assert.equal(metric.value, 1500);
  assert.ok(metric.recordedAt);
});

// ---------------------------------------------------------------------------
// Distribution Analytics — getDistributionReport
// ---------------------------------------------------------------------------

test("getDistributionReport aggregates metrics by channel", async () => {
  await trackDistributionMetric("tenant-1", "seo", "traffic", 1000);
  await trackDistributionMetric("tenant-1", "seo", "traffic", 500);
  await trackDistributionMetric("tenant-1", "social", "traffic", 300);
  await trackDistributionMetric("tenant-1", "seo", "conversions", 50);

  const report = getDistributionReport("tenant-1", "30d");

  assert.equal(report.tenantId, "tenant-1");
  assert.equal(report.period, "30d");
  assert.equal(report.totalTraffic, 1800);
  assert.equal(report.totalConversions, 50);

  const seoChannel = report.channels.find((c) => c.channel === "seo");
  assert.ok(seoChannel);
  assert.equal(seoChannel.metrics.traffic, 1500);
  assert.equal(seoChannel.metrics.conversions, 50);
});

test("getDistributionReport returns empty for tenant with no data", () => {
  const report = getDistributionReport("empty-tenant", "30d");

  assert.equal(report.channels.length, 0);
  assert.equal(report.totalTraffic, 0);
  assert.equal(report.totalConversions, 0);
});

// ---------------------------------------------------------------------------
// Distribution Analytics — getTopPerformingContent
// ---------------------------------------------------------------------------

test("getTopPerformingContent returns ranked content", async () => {
  await trackDistributionMetric("tenant-1", "seo", "traffic", 2000);
  await trackDistributionMetric("tenant-1", "social", "traffic", 500);
  await trackDistributionMetric("tenant-1", "paid", "traffic", 1000);

  const top = getTopPerformingContent("tenant-1", 10);

  assert.ok(top.length > 0);
  assert.ok(top[0].traffic >= top[top.length - 1].traffic);
});

test("getTopPerformingContent respects limit", async () => {
  await trackDistributionMetric("tenant-1", "seo", "traffic", 100);
  await trackDistributionMetric("tenant-1", "social", "traffic", 200);
  await trackDistributionMetric("tenant-1", "paid", "traffic", 300);

  const top = getTopPerformingContent("tenant-1", 2);

  assert.ok(top.length <= 2);
});

// ---------------------------------------------------------------------------
// Type exports exist
// ---------------------------------------------------------------------------

test("exported types are well-formed", () => {
  const seoPage: SeoPage = {
    id: "1", tenantId: "t", niche: "n", keyword: "k", template: "s",
    title: "t", metaDescription: "m", h1: "h",
    bodySections: [{ heading: "h", content: "c" }],
    schemaMarkup: {}, createdAt: new Date().toISOString(),
  };
  const progPage: ProgrammaticPage = {
    id: "1", tenantId: "t", niche: "n", location: "l", slug: "s",
    title: "t", metaDescription: "m", h1: "h",
    bodySections: [{ heading: "h", content: "c" }],
    schemaMarkup: {}, createdAt: new Date().toISOString(),
  };
  const outline: BlogOutline = {
    id: "1", tenantId: "t", niche: "n", topic: "t", targetKeyword: "k",
    headings: [{ level: "h2", text: "h" }],
    targetWordCount: 1500, internalLinkSuggestions: [],
    createdAt: new Date().toISOString(),
  };
  const post: SocialPost = {
    id: "1", tenantId: "t", platform: "twitter", content: "c",
    characterLimit: 280, sourceContentId: "s",
    createdAt: new Date().toISOString(),
  };
  const schedule: ContentSchedule = {
    id: "1", tenantId: "t", contentType: "blog", contentId: "c",
    title: "t", publishAt: new Date().toISOString(),
    status: "scheduled", createdAt: new Date().toISOString(),
  };
  const metric: DistributionMetric = {
    id: "1", tenantId: "t", channel: "seo", metric: "traffic",
    value: 100, recordedAt: new Date().toISOString(),
  };
  const report: DistributionReport = {
    tenantId: "t", period: "30d", channels: [],
    totalTraffic: 0, totalConversions: 0,
  };

  assert.ok(seoPage.id);
  assert.ok(progPage.id);
  assert.ok(outline.id);
  assert.ok(post.id);
  assert.ok(schedule.id);
  assert.ok(metric.id);
  assert.ok(report.tenantId);
});

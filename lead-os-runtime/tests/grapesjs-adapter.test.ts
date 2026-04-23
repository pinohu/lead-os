import test from "node:test";
import assert from "node:assert/strict";
import {
  createPage,
  getPage,
  updatePage,
  deletePage,
  listPages,
  publishPage,
  duplicatePage,
  listTemplates,
  createFromTemplate,
  injectLeadWidget,
  getPageAnalytics,
  resetGrapesJSStore,
  _getPageStoreForTesting,
  PAGE_TEMPLATES,
} from "../src/lib/integrations/grapesjs-adapter.ts";

// ---------------------------------------------------------------------------
// createPage + getPage
// ---------------------------------------------------------------------------

test("createPage creates a page and getPage retrieves it", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-test-${Date.now()}`;
  const page = await createPage(tenantId, {
    name: "My Landing Page",
    slug: "my-landing-page",
  });

  assert.ok(page.id.startsWith("gpage-"));
  assert.equal(page.tenantId, tenantId);
  assert.equal(page.name, "My Landing Page");
  assert.equal(page.slug, "my-landing-page");
  assert.equal(page.status, "draft");
  assert.ok(page.html.includes("My Landing Page"));
  assert.ok(page.createdAt);
  assert.equal(page.publishedUrl, undefined);

  const retrieved = await getPage(page.id);
  assert.equal(retrieved.id, page.id);
  assert.equal(retrieved.name, page.name);
});

// ---------------------------------------------------------------------------
// listPages scoped to tenant
// ---------------------------------------------------------------------------

test("listPages returns pages scoped to tenant", async () => {
  resetGrapesJSStore();
  const t1 = `gjs-t1-${Date.now()}`;
  const t2 = `gjs-t2-${Date.now()}`;

  await createPage(t1, { name: "Page A", slug: "page-a" });
  await createPage(t2, { name: "Page B", slug: "page-b" });
  await createPage(t1, { name: "Page C", slug: "page-c" });

  const t1Pages = await listPages(t1);
  const t2Pages = await listPages(t2);

  assert.equal(t1Pages.length, 2);
  assert.equal(t2Pages.length, 1);
  assert.equal(t2Pages[0]!.name, "Page B");
});

// ---------------------------------------------------------------------------
// updatePage
// ---------------------------------------------------------------------------

test("updatePage modifies page fields", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-update-${Date.now()}`;
  const page = await createPage(tenantId, { name: "Original", slug: "original" });

  const updated = await updatePage(page.id, { name: "Updated Name" });

  assert.equal(updated.name, "Updated Name");
  assert.ok(updated.updatedAt >= page.updatedAt);
});

// ---------------------------------------------------------------------------
// deletePage
// ---------------------------------------------------------------------------

test("deletePage removes a page from the store", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-del-${Date.now()}`;
  const page = await createPage(tenantId, { name: "Delete Me", slug: "delete-me" });

  await deletePage(page.id);

  assert.equal(_getPageStoreForTesting().has(page.id), false);
  await assert.rejects(() => getPage(page.id), /not found/);
});

// ---------------------------------------------------------------------------
// publishPage
// ---------------------------------------------------------------------------

test("publishPage sets status to published and returns publishedUrl", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-pub-${Date.now()}`;
  const page = await createPage(tenantId, { name: "Publish Test", slug: "publish-test" });

  const result = await publishPage(page.id);

  assert.equal(result.page.status, "published");
  assert.ok(result.publishedUrl.includes("publish-test"));
  assert.ok(result.publishedAt);

  const retrieved = await getPage(page.id);
  assert.equal(retrieved.status, "published");
  assert.ok(retrieved.publishedUrl);
});

// ---------------------------------------------------------------------------
// duplicatePage
// ---------------------------------------------------------------------------

test("duplicatePage creates a copy with new name and draft status", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-dup-${Date.now()}`;
  const original = await createPage(tenantId, { name: "Original Page", slug: "original-page" });
  await publishPage(original.id);

  const duplicate = await duplicatePage(original.id, "Duplicate Page");

  assert.notEqual(duplicate.id, original.id);
  assert.equal(duplicate.name, "Duplicate Page");
  assert.equal(duplicate.slug, "duplicate-page");
  assert.equal(duplicate.status, "draft");
  assert.equal(duplicate.publishedUrl, undefined);
  assert.equal(duplicate.tenantId, tenantId);
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

test("listTemplates returns at least 5 pre-built templates", async () => {
  const templates = await listTemplates();

  assert.ok(templates.length >= 5);
  assert.ok(templates.some((t) => t.id === "tmpl-high-converting-squeeze"));
  assert.ok(templates.some((t) => t.id === "tmpl-webinar-registration"));
  assert.ok(templates.some((t) => t.id === "tmpl-service-booking"));
  assert.ok(templates.some((t) => t.id === "tmpl-case-study-landing"));
  assert.ok(templates.some((t) => t.id === "tmpl-lead-magnet-download"));
});

test("createFromTemplate builds a page from a template", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-tmpl-${Date.now()}`;

  const page = await createFromTemplate(tenantId, "tmpl-high-converting-squeeze", {
    name: "My Squeeze",
    slug: "my-squeeze",
  });

  assert.equal(page.tenantId, tenantId);
  assert.equal(page.name, "My Squeeze");
  assert.ok(page.html.includes("capture-form"));
  assert.equal(page.status, "draft");
});

// ---------------------------------------------------------------------------
// Lead widget injection
// ---------------------------------------------------------------------------

test("injectLeadWidget adds widget HTML to the page", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-widget-${Date.now()}`;
  const page = await createPage(tenantId, { name: "Widget Test", slug: "widget-test" });

  const updated = await injectLeadWidget(page.id, {
    type: "form",
    position: "bottom",
    fields: [
      { name: "Email", type: "email", required: true },
      { name: "Name", type: "text", required: false },
    ],
    submitAction: "capture-lead",
  });

  assert.ok(updated.html.includes("lead-widget"));
  assert.ok(updated.html.includes("lead-widget-form"));
  assert.ok(updated.html.includes('name="Email"'));
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

test("getPageAnalytics returns default zero analytics for new page", async () => {
  resetGrapesJSStore();
  const tenantId = `gjs-analytics-${Date.now()}`;
  const page = await createPage(tenantId, { name: "Analytics Test", slug: "analytics-test" });

  const analytics = await getPageAnalytics(page.id);

  assert.equal(analytics.views, 0);
  assert.equal(analytics.uniqueVisitors, 0);
  assert.equal(analytics.formSubmissions, 0);
  assert.equal(analytics.conversionRate, 0);
  assert.equal(analytics.bounceRate, 0);
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

test("getPage throws for nonexistent page ID", async () => {
  resetGrapesJSStore();
  await assert.rejects(
    () => getPage("does-not-exist"),
    /not found/,
  );
});

test("createFromTemplate throws for nonexistent template", async () => {
  resetGrapesJSStore();
  await assert.rejects(
    () => createFromTemplate("t1", "tmpl-nonexistent"),
    /not found/,
  );
});

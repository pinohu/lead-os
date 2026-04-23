import test from "node:test";
import assert from "node:assert/strict";
import {
  generateAuthoritySite,
  getSite,
  listSites,
  addContentPage,
  generateSEOPages,
  deploySite,
  listNicheTemplates,
  resetAuthoritySiteStore,
  NICHE_TEMPLATES,
} from "../src/lib/integrations/authority-site-adapter.ts";

// ---------------------------------------------------------------------------
// generateAuthoritySite + getSite
// ---------------------------------------------------------------------------

test("generateAuthoritySite creates a site and getSite retrieves it", async () => {
  resetAuthoritySiteStore();
  const site = await generateAuthoritySite("as-t1", {
    niche: "pest-management",
    businessName: "BugBusters",
    location: "Austin TX",
    services: ["Termite Control", "Rodent Removal"],
    template: "pest-management",
  });

  assert.ok(site.id.startsWith("auth-site-"));
  assert.equal(site.tenantId, "as-t1");
  assert.equal(site.niche, "pest-management");
  assert.equal(site.businessName, "BugBusters");
  assert.equal(site.status, "draft");
  assert.ok(site.seoScore > 0);
  assert.ok(site.pages.length >= 4);
  assert.ok(site.createdAt);

  const retrieved = await getSite(site.id);
  assert.equal(retrieved.id, site.id);
});

// ---------------------------------------------------------------------------
// listSites
// ---------------------------------------------------------------------------

test("listSites returns sites scoped to tenant", async () => {
  resetAuthoritySiteStore();
  await generateAuthoritySite("as-ta", { niche: "general", businessName: "Biz A", location: "NYC", services: ["Consulting"], template: "general" });
  await generateAuthoritySite("as-tb", { niche: "general", businessName: "Biz B", location: "LA", services: ["Design"], template: "general" });
  await generateAuthoritySite("as-ta", { niche: "general", businessName: "Biz C", location: "CHI", services: ["Dev"], template: "general" });

  const taSites = await listSites("as-ta");
  const tbSites = await listSites("as-tb");
  assert.equal(taSites.length, 2);
  assert.equal(tbSites.length, 1);
});

// ---------------------------------------------------------------------------
// addContentPage
// ---------------------------------------------------------------------------

test("addContentPage adds a page to the site", async () => {
  resetAuthoritySiteStore();
  const site = await generateAuthoritySite("as-t2", {
    niche: "fire-door-compliance",
    businessName: "FireSafe",
    location: "London",
    services: ["Fire Door Inspection"],
    template: "fire-door-compliance",
  });

  const initialCount = site.pages.length;
  const updated = await addContentPage(site.id, {
    slug: "pricing-as",
    title: "Pricing",
    content: "<h1>Pricing</h1><p>Our rates.</p>",
    metaTitle: "Pricing | FireSafe",
    metaDescription: "Fire door inspection pricing.",
    keywords: ["pricing", "fire door"],
    type: "landing",
  });

  assert.equal(updated.pages.length, initialCount + 1);
  assert.ok(updated.pages.some((p) => p.slug === "pricing-as"));
});

test("addContentPage rejects duplicate slugs", async () => {
  resetAuthoritySiteStore();
  const site = await generateAuthoritySite("as-t3", {
    niche: "general",
    businessName: "DupTest",
    location: "SF",
    services: ["Testing"],
    template: "general",
  });

  await assert.rejects(
    () => addContentPage(site.id, {
      slug: "home",
      title: "Duplicate Home",
      content: "<h1>Dup</h1>",
      metaTitle: "Dup",
      metaDescription: "Dup",
      keywords: [],
      type: "landing",
    }),
    /already exists/,
  );
});

// ---------------------------------------------------------------------------
// generateSEOPages
// ---------------------------------------------------------------------------

test("generateSEOPages creates SEO-optimized pages for keywords", async () => {
  resetAuthoritySiteStore();
  const site = await generateAuthoritySite("as-t4", {
    niche: "pest-management",
    businessName: "PestPro",
    location: "Denver",
    services: ["Pest Control"],
    template: "pest-management",
  });

  const generated = await generateSEOPages(site.id, ["bed bug treatment", "ant removal"]);
  assert.equal(generated.length, 2);
  assert.equal(generated[0]!.targetKeyword, "bed bug treatment");
  assert.ok(generated[0]!.estimatedDifficulty > 0);
  assert.ok(generated[0]!.page.slug.length > 0);

  const updatedSite = await getSite(site.id);
  assert.ok(updatedSite.pages.length > site.pages.length);
});

// ---------------------------------------------------------------------------
// deploySite
// ---------------------------------------------------------------------------

test("deploySite publishes the site and returns a deploy result", async () => {
  resetAuthoritySiteStore();
  const site = await generateAuthoritySite("as-t5", {
    niche: "private-utility-locators",
    businessName: "LocateNow",
    location: "Dallas",
    services: ["Utility Locating"],
    domain: "locatenow.com",
    template: "private-utility-locators",
  });

  const result = await deploySite(site.id);
  assert.ok(result.url.includes("locatenow.com"));
  assert.ok(result.deployedAt);
  assert.ok(result.pagesDeployed > 0);

  const published = await getSite(site.id);
  assert.equal(published.status, "published");
});

// ---------------------------------------------------------------------------
// listNicheTemplates
// ---------------------------------------------------------------------------

test("listNicheTemplates returns all pre-built templates", () => {
  const templates = listNicheTemplates();
  assert.equal(templates.length, 5);

  const niches = templates.map((t) => t.niche);
  assert.ok(niches.includes("pest-management"));
  assert.ok(niches.includes("errcs-bda"));
  assert.ok(niches.includes("fire-door-compliance"));
  assert.ok(niches.includes("private-utility-locators"));
  assert.ok(niches.includes("general"));
});

// ---------------------------------------------------------------------------
// invalid template
// ---------------------------------------------------------------------------

test("generateAuthoritySite rejects unknown template", async () => {
  resetAuthoritySiteStore();
  await assert.rejects(
    () => generateAuthoritySite("as-t6", {
      niche: "fake",
      businessName: "Nope",
      location: "Nowhere",
      services: ["Nothing"],
      template: "nonexistent-template",
    }),
    /not found/,
  );
});

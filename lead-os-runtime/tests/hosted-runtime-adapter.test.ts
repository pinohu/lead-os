import test from "node:test";
import assert from "node:assert/strict";
import {
  provisionSubdomain,
  getSite,
  listSites,
  updateSiteConfig,
  deploySite,
  getDeploymentStatus,
  deleteSite,
  setCustomDomain,
  getSiteAnalytics,
  resetHostedRuntimeStore,
} from "../src/lib/integrations/hosted-runtime-adapter.ts";

// ---------------------------------------------------------------------------
// provisionSubdomain + getSite
// ---------------------------------------------------------------------------

test("provisionSubdomain creates a site and getSite retrieves it", async () => {
  resetHostedRuntimeStore();
  const site = await provisionSubdomain("hr-t1", {
    subdomain: "acme-hr",
    sslEnabled: true,
    cdnEnabled: true,
  });

  assert.ok(site.id.startsWith("site-"));
  assert.equal(site.tenantId, "hr-t1");
  assert.equal(site.subdomain, "acme-hr");
  assert.equal(site.fullUrl, "https://acme-hr.leados.io");
  assert.equal(site.status, "active");
  assert.equal(site.sslStatus, "active");
  assert.ok(site.createdAt);

  const retrieved = await getSite(site.id);
  assert.equal(retrieved.id, site.id);
});

// ---------------------------------------------------------------------------
// duplicate subdomain
// ---------------------------------------------------------------------------

test("provisionSubdomain rejects duplicate subdomains", async () => {
  resetHostedRuntimeStore();
  await provisionSubdomain("hr-t2", { subdomain: "unique-hr", sslEnabled: true, cdnEnabled: false });
  await assert.rejects(
    () => provisionSubdomain("hr-t3", { subdomain: "unique-hr", sslEnabled: true, cdnEnabled: false }),
    /already taken/,
  );
});

// ---------------------------------------------------------------------------
// listSites
// ---------------------------------------------------------------------------

test("listSites returns sites scoped to tenant", async () => {
  resetHostedRuntimeStore();
  await provisionSubdomain("hr-ta", { subdomain: "site-a-hr", sslEnabled: true, cdnEnabled: false });
  await provisionSubdomain("hr-tb", { subdomain: "site-b-hr", sslEnabled: true, cdnEnabled: false });
  await provisionSubdomain("hr-ta", { subdomain: "site-c-hr", sslEnabled: false, cdnEnabled: false });

  const taSites = await listSites("hr-ta");
  const tbSites = await listSites("hr-tb");

  assert.equal(taSites.length, 2);
  assert.equal(tbSites.length, 1);
});

// ---------------------------------------------------------------------------
// updateSiteConfig
// ---------------------------------------------------------------------------

test("updateSiteConfig modifies site properties", async () => {
  resetHostedRuntimeStore();
  const site = await provisionSubdomain("hr-t4", { subdomain: "update-me-hr", sslEnabled: true, cdnEnabled: true });

  const updated = await updateSiteConfig(site.id, { customDomain: "custom.example.com" });
  assert.equal(updated.customDomain, "custom.example.com");
  assert.equal(updated.subdomain, "update-me-hr");
});

// ---------------------------------------------------------------------------
// deploySite + getDeploymentStatus
// ---------------------------------------------------------------------------

test("deploySite creates a deployment and getDeploymentStatus retrieves it", async () => {
  resetHostedRuntimeStore();
  const site = await provisionSubdomain("hr-t5", { subdomain: "deploy-me-hr", sslEnabled: true, cdnEnabled: true });

  const result = await deploySite(site.id, {
    html: "<html><body>Hello</body></html>",
    css: "body { color: red; }",
  });

  assert.ok(result.deployId.startsWith("deploy-"));
  assert.equal(result.siteId, site.id);
  assert.equal(result.status, "live");
  assert.ok(result.url);
  assert.ok(result.deployedAt);

  const status = await getDeploymentStatus(result.deployId);
  assert.equal(status.deployId, result.deployId);
  assert.equal(status.status, "live");
  assert.ok(status.logs.length > 0);
  assert.ok(status.completedAt);

  const updatedSite = await getSite(site.id);
  assert.equal(updatedSite.status, "active");
  assert.ok(updatedSite.lastDeployAt);
});

// ---------------------------------------------------------------------------
// deleteSite
// ---------------------------------------------------------------------------

test("deleteSite removes a site from the store", async () => {
  resetHostedRuntimeStore();
  const site = await provisionSubdomain("hr-t6", { subdomain: "delete-me-hr", sslEnabled: false, cdnEnabled: false });

  await deleteSite(site.id);
  await assert.rejects(() => getSite(site.id), /not found/);
});

// ---------------------------------------------------------------------------
// setCustomDomain
// ---------------------------------------------------------------------------

test("setCustomDomain returns DNS config for the domain", async () => {
  resetHostedRuntimeStore();
  const site = await provisionSubdomain("hr-t7", { subdomain: "domain-test-hr", sslEnabled: true, cdnEnabled: true });

  const domainConfig = await setCustomDomain(site.id, "www.example.com");
  assert.equal(domainConfig.siteId, site.id);
  assert.equal(domainConfig.domain, "www.example.com");
  assert.ok(domainConfig.dnsRecords.length >= 2);
  assert.equal(domainConfig.verified, false);

  const updatedSite = await getSite(site.id);
  assert.equal(updatedSite.customDomain, "www.example.com");
});

// ---------------------------------------------------------------------------
// getSiteAnalytics
// ---------------------------------------------------------------------------

test("getSiteAnalytics returns analytics data for a site", async () => {
  resetHostedRuntimeStore();
  const site = await provisionSubdomain("hr-t8", { subdomain: "analytics-hr", sslEnabled: true, cdnEnabled: true });

  const analytics = await getSiteAnalytics(site.id, { from: "2026-01-01", to: "2026-01-08" });
  assert.ok(analytics.visitors > 0);
  assert.ok(analytics.pageviews > 0);
  assert.ok(analytics.bandwidth > 0);
  assert.ok(analytics.topPages.length > 0);
});

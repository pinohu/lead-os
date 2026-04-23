import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  mcpScrape,
  mcpBatchScrape,
  mcpCrawl,
  mcpMap,
  mcpSearch,
  mcpInteract,
  mcpAgent,
  discoverProspects,
  deepEnrichCompany,
  findDecisionMakers,
  analyzeCompetitorLandscape,
  monitorIndustryTrends,
  resetMCPStore,
} from "../src/lib/integrations/firecrawl-mcp-connector.ts";

beforeEach(() => {
  resetMCPStore();
});

// ---------------------------------------------------------------------------
// mcpScrape
// ---------------------------------------------------------------------------

test("mcpScrape returns dry-run result with markdown", async () => {
  const result = await mcpScrape("https://acme-mcp-test.com", {
    formats: ["markdown"],
  });

  assert.equal(result.url, "https://acme-mcp-test.com");
  assert.ok(result.markdown?.includes("acme-mcp-test.com"));
  assert.equal(result.metadata.statusCode, 200);
  assert.ok(result.metadata.title.length > 0);
});

test("mcpScrape returns html and json when requested", async () => {
  const result = await mcpScrape("https://htmljson-mcp-test.com", {
    formats: ["html", "json"],
  });

  assert.ok(result.html?.includes("<html>"));
  assert.ok(result.json);
  assert.equal(result.json.dryRun, true);
});

test("mcpScrape caches results for same URL", async () => {
  const first = await mcpScrape("https://cache-mcp-test.com");
  const second = await mcpScrape("https://cache-mcp-test.com");

  assert.deepEqual(first, second);
});

// ---------------------------------------------------------------------------
// mcpBatchScrape
// ---------------------------------------------------------------------------

test("mcpBatchScrape returns results for all URLs", async () => {
  const results = await mcpBatchScrape([
    "https://batch-mcp-a.com",
    "https://batch-mcp-b.com",
    "https://batch-mcp-c.com",
  ]);

  assert.equal(results.length, 3);
  assert.equal(results[0]!.url, "https://batch-mcp-a.com");
  assert.equal(results[1]!.url, "https://batch-mcp-b.com");
  assert.equal(results[2]!.url, "https://batch-mcp-c.com");
});

test("mcpBatchScrape returns empty array for empty input", async () => {
  const results = await mcpBatchScrape([]);
  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// mcpCrawl
// ---------------------------------------------------------------------------

test("mcpCrawl returns completed job with pages in dry-run", async () => {
  const result = await mcpCrawl("https://crawl-mcp-test.com", {
    maxPages: 5,
  });

  assert.ok(result.jobId.length > 0);
  assert.equal(result.status, "completed");
  assert.ok(result.pagesCrawled > 0);
  assert.ok(result.pagesCrawled <= 5);
  assert.equal(result.results.length, result.pagesCrawled);
});

// ---------------------------------------------------------------------------
// mcpMap
// ---------------------------------------------------------------------------

test("mcpMap returns a list of URLs for the domain", async () => {
  const result = await mcpMap("https://map-mcp-test.com");

  assert.ok(result.urls.length > 0);
  assert.equal(result.totalFound, result.urls.length);
  assert.ok(result.urls.some((u) => u.includes("map-mcp-test.com")));
});

// ---------------------------------------------------------------------------
// mcpSearch
// ---------------------------------------------------------------------------

test("mcpSearch returns search results matching limit", async () => {
  const results = await mcpSearch("plumbing services austin", { limit: 3 });

  assert.equal(results.length, 3);
  for (const r of results) {
    assert.ok(r.url.length > 0);
    assert.ok(r.title.length > 0);
    assert.ok(r.description.length > 0);
  }
});

// ---------------------------------------------------------------------------
// mcpInteract
// ---------------------------------------------------------------------------

test("mcpInteract returns action results for all actions", async () => {
  const result = await mcpInteract("https://interact-mcp-test.com", [
    { type: "click", selector: "#btn" },
    { type: "type", selector: "#input", value: "hello" },
    { type: "screenshot" },
  ]);

  assert.equal(result.url, "https://interact-mcp-test.com");
  assert.equal(result.actions.length, 3);
  assert.ok(result.actions.every((a) => a.success === true));
  assert.ok(result.finalContent.length > 0);
});

// ---------------------------------------------------------------------------
// mcpAgent
// ---------------------------------------------------------------------------

test("mcpAgent returns a dry-run answer with sources", async () => {
  const result = await mcpAgent("What are the best CRM tools for plumbers?", {
    maxSteps: 5,
  });

  assert.ok(result.answer.length > 0);
  assert.ok(result.sources.length > 0);
  assert.ok(result.stepsExecuted > 0);
  assert.ok(result.stepsExecuted <= 5);
});

// ---------------------------------------------------------------------------
// discoverProspects
// ---------------------------------------------------------------------------

test("discoverProspects returns sorted prospects for niche", async () => {
  const prospects = await discoverProspects("austin", "plumbing", 5);

  assert.ok(prospects.length > 0);
  assert.ok(prospects.length <= 5);
  for (const p of prospects) {
    assert.ok(p.businessName.length > 0);
    assert.ok(p.domain.length > 0);
    assert.equal(p.category, "plumbing");
    assert.ok(p.matchScore >= 0 && p.matchScore <= 1);
  }

  for (let i = 1; i < prospects.length; i++) {
    assert.ok(prospects[i - 1]!.matchScore >= prospects[i]!.matchScore);
  }
});

// ---------------------------------------------------------------------------
// deepEnrichCompany
// ---------------------------------------------------------------------------

test("deepEnrichCompany returns a full company profile", async () => {
  const profile = await deepEnrichCompany("enrich-mcp-test.com");

  assert.ok(profile.name.length > 0);
  assert.equal(profile.domain, "enrich-mcp-test.com");
  assert.ok(profile.industry.length > 0);
  assert.ok(profile.size.length > 0);
  assert.ok(Array.isArray(profile.techStack));
  assert.ok(typeof profile.socialLinks === "object");
  assert.ok(Array.isArray(profile.keyPeople));
  assert.ok(Array.isArray(profile.recentNews));
  assert.ok(profile.competitivePosition.length > 0);
});

// ---------------------------------------------------------------------------
// findDecisionMakers
// ---------------------------------------------------------------------------

test("findDecisionMakers returns at least one maker", async () => {
  const makers = await findDecisionMakers("makers-mcp-test.com");

  assert.ok(makers.length >= 1);
  for (const m of makers) {
    assert.ok(m.name.length > 0);
    assert.ok(m.title.length > 0);
    assert.ok(m.department.length > 0);
    assert.ok(
      ["c-level", "vp", "director", "manager"].includes(m.seniorityLevel),
    );
  }
});

// ---------------------------------------------------------------------------
// analyzeCompetitorLandscape
// ---------------------------------------------------------------------------

test("analyzeCompetitorLandscape returns competitors and insights", async () => {
  const analysis = await analyzeCompetitorLandscape("HVAC", "Denver");

  assert.ok(analysis.competitors.length > 0);
  assert.ok(analysis.opportunities.length > 0);
  assert.ok(analysis.threats.length > 0);

  for (const c of analysis.competitors) {
    assert.ok(c.name.length > 0);
    assert.ok(c.domain.length > 0);
    assert.ok(c.strengths.length > 0);
    assert.ok(c.weaknesses.length > 0);
  }
});

// ---------------------------------------------------------------------------
// monitorIndustryTrends
// ---------------------------------------------------------------------------

test("monitorIndustryTrends returns trends for each keyword", async () => {
  const report = await monitorIndustryTrends("plumbing", [
    "smart home",
    "green plumbing",
    "AI scheduling",
  ]);

  assert.equal(report.trends.length, 3);
  assert.ok(report.insights.length > 0);

  for (const t of report.trends) {
    assert.ok(t.topic.length > 0);
    assert.ok(["rising", "stable", "declining"].includes(t.momentum));
    assert.ok(t.sources.length > 0);
  }
});

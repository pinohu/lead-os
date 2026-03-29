import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveHexomaticConfig,
  isHexomaticDryRun,
  createAutomation,
  getAutomation,
  listAutomations,
  runAutomation,
  pauseAutomation,
  getAutomationResults,
  getBuiltInTemplates,
  createFromTemplate,
  scrapeUrl,
  exportResults,
  getHexomaticStats,
  scrapeViaHexomatic,
  resetHexomaticStore,
} from "../src/lib/integrations/hexomatic-adapter.ts";
import type {
  ScrapeSelector,
  CreateAutomationInput,
} from "../src/lib/integrations/hexomatic-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearHexomaticEnv() {
  delete process.env.HEXOMATIC_API_KEY;
  delete process.env.HEXOMATIC_BASE_URL;
}

const SAMPLE_SELECTORS: ScrapeSelector[] = [
  { name: "title", selector: "h1", type: "text" },
  { name: "link", selector: "a.main", type: "href" },
];

function sampleInput(overrides?: Partial<CreateAutomationInput>): CreateAutomationInput {
  return {
    name: "Test Automation",
    sourceUrls: ["https://example.com/page1", "https://example.com/page2"],
    selectors: SAMPLE_SELECTORS,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveHexomaticConfig returns null when no API key", () => {
  clearHexomaticEnv();
  const cfg = resolveHexomaticConfig();
  assert.equal(cfg, null);
});

test("resolveHexomaticConfig returns config when API key is set", () => {
  clearHexomaticEnv();
  process.env.HEXOMATIC_API_KEY = "hx-test-123";
  const cfg = resolveHexomaticConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "hx-test-123");
  assert.equal(cfg.baseUrl, "https://api.hexomatic.com/v2");
  clearHexomaticEnv();
});

test("resolveHexomaticConfig uses custom base URL from env", () => {
  clearHexomaticEnv();
  process.env.HEXOMATIC_API_KEY = "hx-test";
  process.env.HEXOMATIC_BASE_URL = "https://custom.hexomatic.com/v3";
  const cfg = resolveHexomaticConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.hexomatic.com/v3");
  clearHexomaticEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isHexomaticDryRun returns true when no API key", () => {
  clearHexomaticEnv();
  assert.equal(isHexomaticDryRun(), true);
});

test("isHexomaticDryRun returns false when API key is set", () => {
  clearHexomaticEnv();
  process.env.HEXOMATIC_API_KEY = "hx-test";
  assert.equal(isHexomaticDryRun(), false);
  clearHexomaticEnv();
});

// ---------------------------------------------------------------------------
// Automation CRUD
// ---------------------------------------------------------------------------

test("createAutomation creates an automation with draft status", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  assert.ok(automation.id.startsWith("hex-"));
  assert.equal(automation.name, "Test Automation");
  assert.equal(automation.status, "draft");
  assert.equal(automation.sourceUrls.length, 2);
  assert.equal(automation.selectors.length, 2);
  assert.equal(automation.results.length, 0);
  assert.equal(automation.creditsUsed, 0);
  assert.ok(automation.createdAt);

  resetHexomaticStore();
});

test("createAutomation stores tenantId when provided", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({ tenantId: "t-abc" }));
  assert.equal(automation.tenantId, "t-abc");

  resetHexomaticStore();
});

test("createAutomation stores schedule when provided", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({ schedule: "0 9 * * *" }));
  assert.equal(automation.schedule, "0 9 * * *");

  resetHexomaticStore();
});

test("getAutomation returns stored automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const created = await createAutomation(sampleInput());
  const retrieved = await getAutomation(created.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.name, created.name);

  resetHexomaticStore();
});

test("getAutomation returns null for unknown id", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const result = await getAutomation("nonexistent-id");
  assert.equal(result, null);

  resetHexomaticStore();
});

test("listAutomations returns all automations", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await createAutomation(sampleInput({ name: "Auto 1" }));
  await createAutomation(sampleInput({ name: "Auto 2" }));

  const list = await listAutomations();
  assert.equal(list.length, 2);

  resetHexomaticStore();
});

test("listAutomations filters by tenantId", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await createAutomation(sampleInput({ name: "A1", tenantId: "t1" }));
  await createAutomation(sampleInput({ name: "A2", tenantId: "t2" }));
  await createAutomation(sampleInput({ name: "A3", tenantId: "t1" }));

  const t1 = await listAutomations("t1");
  assert.equal(t1.length, 2);

  const t2 = await listAutomations("t2");
  assert.equal(t2.length, 1);

  resetHexomaticStore();
});

test("listAutomations returns empty array when no automations", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const list = await listAutomations();
  assert.equal(list.length, 0);

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Run automation (dry-run)
// ---------------------------------------------------------------------------

test("runAutomation generates dry-run rows between 5-15 per source URL", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  const result = await runAutomation(automation.id);

  assert.equal(result.status, "completed");
  assert.ok(result.results.length >= 5);
  assert.ok(result.creditsUsed > 0);
  assert.equal(result.creditsUsed, result.results.length);
  assert.ok(result.completedAt);

  resetHexomaticStore();
});

test("runAutomation populates data fields matching selectors", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  const result = await runAutomation(automation.id);

  const firstRow = result.results[0];
  assert.ok(firstRow);
  assert.ok("title" in firstRow.data);
  assert.ok("link" in firstRow.data);
  assert.ok(firstRow.scrapedAt);
  assert.ok(firstRow.url);

  resetHexomaticStore();
});

test("runAutomation generates href-type values as URLs", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  const result = await runAutomation(automation.id);

  const row = result.results[0];
  assert.ok(row.data.link.startsWith("https://"));

  resetHexomaticStore();
});

test("runAutomation throws for nonexistent automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await assert.rejects(
    () => runAutomation("nonexistent"),
    { message: "Automation nonexistent not found" },
  );

  resetHexomaticStore();
});

test("runAutomation throws for already completed automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  await runAutomation(automation.id);

  await assert.rejects(
    () => runAutomation(automation.id),
    (err: Error) => err.message.includes("already completed"),
  );

  resetHexomaticStore();
});

test("runAutomation with single source URL generates rows", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({
    sourceUrls: ["https://single.example.com"],
  }));
  const result = await runAutomation(automation.id);

  assert.ok(result.results.length >= 5);
  assert.ok(result.results.length <= 15);
  for (const row of result.results) {
    assert.equal(row.url, "https://single.example.com");
  }

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Pause automation
// ---------------------------------------------------------------------------

test("pauseAutomation pauses a running automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  // Manually set status to running for this test
  const stored = await getAutomation(automation.id);
  assert.ok(stored);
  stored.status = "running";

  const paused = await pauseAutomation(automation.id);
  assert.equal(paused.status, "paused");

  resetHexomaticStore();
});

test("pauseAutomation throws for nonexistent automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await assert.rejects(
    () => pauseAutomation("nonexistent"),
    { message: "Automation nonexistent not found" },
  );

  resetHexomaticStore();
});

test("pauseAutomation throws for non-running automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());

  await assert.rejects(
    () => pauseAutomation(automation.id),
    (err: Error) => err.message.includes("not running"),
  );

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Get automation results
// ---------------------------------------------------------------------------

test("getAutomationResults returns empty array for draft automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  const results = await getAutomationResults(automation.id);
  assert.equal(results.length, 0);

  resetHexomaticStore();
});

test("getAutomationResults returns rows after run", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  await runAutomation(automation.id);
  const results = await getAutomationResults(automation.id);
  assert.ok(results.length > 0);

  resetHexomaticStore();
});

test("getAutomationResults throws for nonexistent automation", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await assert.rejects(
    () => getAutomationResults("nonexistent"),
    { message: "Automation nonexistent not found" },
  );

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

test("getBuiltInTemplates returns 5 templates", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  assert.equal(templates.length, 5);
});

test("getBuiltInTemplates includes Business Directory Scraper", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  const biz = templates.find((t) => t.name === "Business Directory Scraper");
  assert.ok(biz);
  assert.ok(biz.selectors.length > 0);
  assert.ok(biz.description);
});

test("getBuiltInTemplates includes Contact Page Extractor", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  const contact = templates.find((t) => t.name === "Contact Page Extractor");
  assert.ok(contact);
});

test("getBuiltInTemplates includes Google Results Scraper", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  const google = templates.find((t) => t.name === "Google Results Scraper");
  assert.ok(google);
});

test("getBuiltInTemplates includes Social Profile Extractor", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  const social = templates.find((t) => t.name === "Social Profile Extractor");
  assert.ok(social);
});

test("getBuiltInTemplates includes Review Scraper", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  const review = templates.find((t) => t.name === "Review Scraper");
  assert.ok(review);
});

// ---------------------------------------------------------------------------
// Create from template
// ---------------------------------------------------------------------------

test("createFromTemplate creates automation from built-in template", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const templates = getBuiltInTemplates();
  const templateId = templates[0].id;

  const automation = await createFromTemplate(templateId, ["https://yelp.com/biz/list"]);
  assert.ok(automation.id);
  assert.ok(automation.name.includes("(from template)"));
  assert.equal(automation.sourceUrls.length, 1);
  assert.equal(automation.selectors.length, templates[0].selectors.length);
  assert.equal(automation.status, "draft");

  resetHexomaticStore();
});

test("createFromTemplate throws for unknown template", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await assert.rejects(
    () => createFromTemplate("unknown-template", ["https://example.com"]),
    (err: Error) => err.message.includes("not found"),
  );

  resetHexomaticStore();
});

test("createFromTemplate stores tenantId", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const templates = getBuiltInTemplates();
  const automation = await createFromTemplate(templates[0].id, ["https://example.com"], "t-xyz");
  assert.equal(automation.tenantId, "t-xyz");

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// One-off URL scrape
// ---------------------------------------------------------------------------

test("scrapeUrl generates dry-run rows", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const rows = await scrapeUrl("https://example.com/listings", SAMPLE_SELECTORS);
  assert.ok(rows.length >= 5);
  assert.ok(rows.length <= 15);

  for (const row of rows) {
    assert.equal(row.url, "https://example.com/listings");
    assert.ok("title" in row.data);
    assert.ok("link" in row.data);
    assert.ok(row.scrapedAt);
  }

  resetHexomaticStore();
});

test("scrapeUrl with empty selectors generates rows with empty data", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const rows = await scrapeUrl("https://example.com", []);
  assert.ok(rows.length >= 5);
  for (const row of rows) {
    assert.deepEqual(row.data, {});
  }

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Export results
// ---------------------------------------------------------------------------

test("exportResults as JSON returns valid JSON", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  await runAutomation(automation.id);

  const json = await exportResults(automation.id, "json");
  const parsed = JSON.parse(json);
  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.length > 0);

  resetHexomaticStore();
});

test("exportResults as CSV returns valid CSV with headers", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  await runAutomation(automation.id);

  const csv = await exportResults(automation.id, "csv");
  const lines = csv.split("\n");
  assert.ok(lines.length > 1);

  const headers = lines[0];
  assert.ok(headers.includes("url"));
  assert.ok(headers.includes("scrapedAt"));
  assert.ok(headers.includes("title"));
  assert.ok(headers.includes("link"));

  resetHexomaticStore();
});

test("exportResults as CSV returns empty string for empty results", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  const csv = await exportResults(automation.id, "csv");
  assert.equal(csv, "");

  resetHexomaticStore();
});

test("exportResults as JSON returns empty array for empty results", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput());
  const json = await exportResults(automation.id, "json");
  assert.equal(json, "[]");

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

test("getHexomaticStats returns zeros for empty store", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const stats = await getHexomaticStats();
  assert.equal(stats.totalAutomations, 0);
  assert.equal(stats.totalRows, 0);
  assert.equal(stats.creditsUsed, 0);
  assert.equal(stats.topDomains.length, 0);

  resetHexomaticStore();
});

test("getHexomaticStats reflects completed automations", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const a1 = await createAutomation(sampleInput({ name: "S1" }));
  await runAutomation(a1.id);

  const stats = await getHexomaticStats();
  assert.equal(stats.totalAutomations, 1);
  assert.ok(stats.totalRows > 0);
  assert.ok(stats.creditsUsed > 0);
  assert.ok(stats.topDomains.length > 0);

  resetHexomaticStore();
});

test("getHexomaticStats filters by tenantId", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const a1 = await createAutomation(sampleInput({ name: "S1", tenantId: "t1" }));
  const a2 = await createAutomation(sampleInput({ name: "S2", tenantId: "t2" }));
  await runAutomation(a1.id);
  await runAutomation(a2.id);

  const statsT1 = await getHexomaticStats("t1");
  assert.equal(statsT1.totalAutomations, 1);

  const statsAll = await getHexomaticStats();
  assert.equal(statsAll.totalAutomations, 2);

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// ProviderResult integration
// ---------------------------------------------------------------------------

test("scrapeViaHexomatic returns ProviderResult in dry-run mode", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const pr = await scrapeViaHexomatic("https://example.com", SAMPLE_SELECTORS);
  assert.equal(pr.ok, true);
  assert.equal(pr.provider, "Hexomatic");
  assert.equal(pr.mode, "dry-run");
  assert.ok(pr.detail.includes("Scraped"));
  assert.ok(pr.detail.includes("example.com"));
  assert.ok(pr.payload);
  assert.equal(pr.payload.url, "https://example.com");
  assert.ok(typeof pr.payload.rowCount === "number");

  resetHexomaticStore();
});

test("scrapeViaHexomatic includes rows in payload", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const pr = await scrapeViaHexomatic("https://example.com", SAMPLE_SELECTORS);
  assert.ok(pr.payload);
  assert.ok(Array.isArray(pr.payload.rows));
  assert.ok((pr.payload.rows as unknown[]).length > 0);

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("createAutomation with empty sourceUrls array succeeds", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({ sourceUrls: [] }));
  assert.ok(automation.id);
  assert.equal(automation.sourceUrls.length, 0);

  resetHexomaticStore();
});

test("runAutomation with empty sourceUrls generates zero rows", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({ sourceUrls: [] }));
  const result = await runAutomation(automation.id);
  assert.equal(result.results.length, 0);
  assert.equal(result.status, "completed");

  resetHexomaticStore();
});

test("createAutomation with empty selectors succeeds", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({ selectors: [] }));
  assert.ok(automation.id);
  assert.equal(automation.selectors.length, 0);

  resetHexomaticStore();
});

test("runAutomation with empty selectors generates rows with empty data", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const automation = await createAutomation(sampleInput({
    sourceUrls: ["https://example.com"],
    selectors: [],
  }));
  const result = await runAutomation(automation.id);

  assert.ok(result.results.length > 0);
  for (const row of result.results) {
    assert.deepEqual(row.data, {});
  }

  resetHexomaticStore();
});

test("multiple automations get unique IDs", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  const a1 = await createAutomation(sampleInput({ name: "A1" }));
  const a2 = await createAutomation(sampleInput({ name: "A2" }));
  const a3 = await createAutomation(sampleInput({ name: "A3" }));

  assert.notEqual(a1.id, a2.id);
  assert.notEqual(a2.id, a3.id);
  assert.notEqual(a1.id, a3.id);

  resetHexomaticStore();
});

// ---------------------------------------------------------------------------
// Reset store
// ---------------------------------------------------------------------------

test("resetHexomaticStore clears all stored automations", async () => {
  clearHexomaticEnv();
  resetHexomaticStore();

  await createAutomation(sampleInput());
  const before = await listAutomations();
  assert.ok(before.length > 0);

  resetHexomaticStore();

  const after = await listAutomations();
  assert.equal(after.length, 0);
});

test("resetHexomaticStore clears templates so they reload", () => {
  resetHexomaticStore();
  const templates = getBuiltInTemplates();
  assert.equal(templates.length, 5);

  resetHexomaticStore();
  const templates2 = getBuiltInTemplates();
  assert.equal(templates2.length, 5);
});

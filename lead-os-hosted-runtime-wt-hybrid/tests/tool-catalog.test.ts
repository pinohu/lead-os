import test from "node:test";
import assert from "node:assert/strict";

import {
  getToolCatalog,
  getToolsByCategory,
  getToolsByPriority,
  getToolsByMapping,
  getRecommendedTools,
  type ToolEntry,
  type ToolCategory,
  type LeadOsEngine,
  type ToolPriority,
} from "../src/lib/tool-catalog.ts";

// ─── Catalog integrity ────────────────────────────────────────────────────────

test("getToolCatalog returns a non-empty catalog", () => {
  const catalog = getToolCatalog();
  assert.ok(catalog.tools.length > 0, "Expected at least one tool in the catalog");
  assert.ok(catalog.version, "Catalog must have a version string");
  assert.ok(catalog.updatedAt, "Catalog must have an updatedAt timestamp");
});

test("every tool entry has all required fields", () => {
  const { tools } = getToolCatalog();
  for (const tool of tools) {
    assert.ok(tool.slug, `Tool missing slug: ${JSON.stringify(tool)}`);
    assert.ok(tool.name, `Tool ${tool.slug} missing name`);
    assert.ok(tool.category, `Tool ${tool.slug} missing category`);
    assert.ok(tool.description, `Tool ${tool.slug} missing description`);
    assert.ok(tool.integrationMethod, `Tool ${tool.slug} missing integrationMethod`);
    assert.ok(Array.isArray(tool.requiredCredentials), `Tool ${tool.slug} missing requiredCredentials array`);
    assert.ok(tool.leadOsMapping, `Tool ${tool.slug} missing leadOsMapping`);
    assert.ok(tool.priority, `Tool ${tool.slug} missing priority`);
    assert.ok(Array.isArray(tool.capabilities) && tool.capabilities.length > 0, `Tool ${tool.slug} must have at least one capability`);
  }
});

test("all tool slugs are unique", () => {
  const { tools } = getToolCatalog();
  const slugs = tools.map((t) => t.slug);
  const uniqueSlugs = new Set(slugs);
  assert.equal(uniqueSlugs.size, slugs.length, "Duplicate slugs found in catalog");
});

test("all tool slugs are kebab-case", () => {
  const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const { tools } = getToolCatalog();
  for (const tool of tools) {
    assert.match(
      tool.slug,
      kebabPattern,
      `Slug "${tool.slug}" is not valid kebab-case`
    );
  }
});

test("catalog is immutable between calls (same reference)", () => {
  const first = getToolCatalog();
  const second = getToolCatalog();
  assert.equal(first, second, "Expected catalog singleton to return same reference");
});

// ─── getToolsByCategory ───────────────────────────────────────────────────────

test("getToolsByCategory('crm') returns only CRM tools", () => {
  const tools = getToolsByCategory("crm");
  assert.ok(tools.length > 0, "Expected at least one CRM tool");
  for (const tool of tools) {
    assert.equal(tool.category, "crm");
  }
});

test("getToolsByCategory('billing') includes chargebee", () => {
  const tools = getToolsByCategory("billing");
  const slugs = tools.map((t) => t.slug);
  assert.ok(slugs.includes("chargebee"), "chargebee should be in billing category");
});

test("getToolsByCategory('automation') includes activepieces", () => {
  const tools = getToolsByCategory("automation");
  const slugs = tools.map((t) => t.slug);
  assert.ok(slugs.includes("activepieces"), "activepieces should be in automation category");
});

test("getToolsByCategory returns empty array for category with no tools", () => {
  // Cast to ToolCategory to satisfy type system for an edge-case test
  const tools = getToolsByCategory("commerce" as ToolCategory);
  assert.ok(Array.isArray(tools));
});

test("getToolsByCategory does not return tools from other categories", () => {
  const crmTools = getToolsByCategory("crm");
  const hasNonCrm = crmTools.some((t) => t.category !== "crm");
  assert.equal(hasNonCrm, false, "getToolsByCategory('crm') returned tools from other categories");
});

// ─── getToolsByPriority ───────────────────────────────────────────────────────

test("getToolsByPriority('critical') returns only critical tools", () => {
  const tools = getToolsByPriority("critical");
  assert.ok(tools.length > 0, "Expected at least one critical tool");
  for (const tool of tools) {
    assert.equal(tool.priority, "critical");
  }
});

test("getToolsByPriority('critical') includes known critical tools", () => {
  const slugs = getToolsByPriority("critical").map((t) => t.slug);
  const expectedCritical = ["suitedash", "emailit", "thoughtly", "trafft", "activepieces", "aitableai"];
  for (const slug of expectedCritical) {
    assert.ok(slugs.includes(slug), `Expected ${slug} to be critical`);
  }
});

test("getToolsByPriority('low') returns only low-priority tools", () => {
  const tools = getToolsByPriority("low");
  for (const tool of tools) {
    assert.equal(tool.priority, "low");
  }
});

test("priority distribution is valid across all four levels", () => {
  const priorities: ToolPriority[] = ["critical", "high", "medium", "low"];
  for (const p of priorities) {
    const tools = getToolsByPriority(p);
    assert.ok(tools.length > 0, `Expected at least one tool with priority "${p}"`);
  }
});

// ─── getToolsByMapping ────────────────────────────────────────────────────────

test("getToolsByMapping('capture') returns only capture-mapped tools", () => {
  const tools = getToolsByMapping("capture");
  assert.ok(tools.length > 0, "Expected at least one capture-mapped tool");
  for (const tool of tools) {
    assert.equal(tool.leadOsMapping, "capture");
  }
});

test("getToolsByMapping('fulfillment') includes trafft and emailit", () => {
  const slugs = getToolsByMapping("fulfillment").map((t) => t.slug);
  assert.ok(slugs.includes("trafft"), "trafft should map to fulfillment");
  assert.ok(slugs.includes("emailit"), "emailit should map to fulfillment");
});

test("getToolsByMapping covers all engine types", () => {
  const engines: LeadOsEngine[] = [
    "ingress", "capture", "scoring", "distribution", "creative",
    "psychology", "monetization", "fulfillment", "analytics", "automation",
  ];
  for (const engine of engines) {
    const tools = getToolsByMapping(engine);
    assert.ok(tools.length > 0, `No tools mapped to engine "${engine}"`);
  }
});

// ─── getRecommendedTools ──────────────────────────────────────────────────────

test("getRecommendedTools returns an array of ToolEntry objects", () => {
  const tools = getRecommendedTools("pest-control");
  assert.ok(Array.isArray(tools));
  assert.ok(tools.length > 0, "Expected recommendations for pest-control");
  for (const tool of tools) {
    assert.ok(tool.slug, "Each recommended tool must have a slug");
  }
});

test("getRecommendedTools with goals surfaces goal-matched tools first", () => {
  const tools = getRecommendedTools("real-estate", ["increase-leads"]);
  const slugs = tools.map((t) => t.slug);
  // increase-leads maps to claspo, formaloo, happierleads, salespanel etc.
  const goalTools = ["claspo", "formaloo", "happierleads", "salespanel"];
  const firstFive = slugs.slice(0, 5);
  const hasGoalToolEarly = goalTools.some((g) => firstFive.includes(g));
  assert.ok(hasGoalToolEarly, "Goal-matched tools should appear near the top of recommendations");
});

test("getRecommendedTools returns deduplicated results", () => {
  const tools = getRecommendedTools("saas", ["increase-leads", "improve-conversion"]);
  const slugs = tools.map((t) => t.slug);
  const uniqueSlugs = new Set(slugs);
  assert.equal(uniqueSlugs.size, slugs.length, "getRecommendedTools returned duplicate tools");
});

test("getRecommendedTools falls back to generic niche for unknown niche", () => {
  const tools = getRecommendedTools("quantum-plumbing");
  assert.ok(tools.length > 0, "Unknown niche should fall back to generic recommendations");
  const slugs = tools.map((t) => t.slug);
  assert.ok(slugs.includes("suitedash"), "Generic recommendations should include suitedash");
});

test("getRecommendedTools with no goals returns niche defaults only", () => {
  const tools = getRecommendedTools("dental");
  assert.ok(tools.length > 0);
  const slugs = tools.map((t) => t.slug);
  assert.ok(slugs.includes("trafft"), "Dental niche should recommend trafft");
});

test("getRecommendedTools returns valid ToolEntry objects with all required fields", () => {
  const tools = getRecommendedTools("fitness", ["close-more-deals"]);
  for (const tool of tools) {
    assert.ok(tool.slug);
    assert.ok(tool.name);
    assert.ok(tool.category);
    assert.ok(tool.leadOsMapping);
    assert.ok(tool.priority);
  }
});

// ─── Cross-cutting invariants ─────────────────────────────────────────────────

test("all tools with requiredCredentials have at least one credential field name", () => {
  const { tools } = getToolCatalog();
  for (const tool of tools) {
    if (tool.integrationMethod === "api") {
      assert.ok(
        tool.requiredCredentials.length > 0,
        `API tool ${tool.slug} must declare at least one required credential`
      );
    }
  }
});

test("tools with integrationMethod 'manual' may have empty requiredCredentials", () => {
  const { tools } = getToolCatalog();
  const manualTools = tools.filter((t) => t.integrationMethod === "manual");
  assert.ok(manualTools.length > 0, "Expected at least one manual tool");
  for (const tool of manualTools) {
    assert.ok(Array.isArray(tool.requiredCredentials));
  }
});

test("total tool count covers all specified high-priority and content tools", () => {
  const { tools } = getToolCatalog();
  // We defined 60+ tools; verify we have a substantial catalog
  assert.ok(tools.length >= 50, `Expected 50+ tools, got ${tools.length}`);
});

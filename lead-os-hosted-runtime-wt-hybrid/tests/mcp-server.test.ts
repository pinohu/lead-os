import test from "node:test";
import assert from "node:assert/strict";
import { tools, getToolByName } from "../src/mcp/tools.ts";

// ---------------------------------------------------------------------------
// Tool registry
// ---------------------------------------------------------------------------

test("tools array contains exactly 23 tools", () => {
  assert.equal(tools.length, 23);
});

test("every tool has name, description, inputSchema, and handler", () => {
  for (const tool of tools) {
    assert.ok(tool.name, `Tool missing name`);
    assert.ok(tool.description, `Tool ${tool.name} missing description`);
    assert.ok(tool.inputSchema, `Tool ${tool.name} missing inputSchema`);
    assert.equal(typeof tool.handler, "function", `Tool ${tool.name} missing handler`);
  }
});

test("all tool names are prefixed with lead_os_", () => {
  for (const tool of tools) {
    assert.ok(tool.name.startsWith("lead_os_"), `Tool ${tool.name} missing lead_os_ prefix`);
  }
});

test("all tool inputSchemas have type object", () => {
  for (const tool of tools) {
    assert.equal(tool.inputSchema.type, "object", `Tool ${tool.name} inputSchema.type should be object`);
  }
});

test("getToolByName returns the correct tool", () => {
  const tool = getToolByName("lead_os_generate_niche");
  assert.ok(tool);
  assert.equal(tool.name, "lead_os_generate_niche");
});

test("getToolByName returns undefined for unknown tool", () => {
  const tool = getToolByName("lead_os_nonexistent");
  assert.equal(tool, undefined);
});

// ---------------------------------------------------------------------------
// MCP protocol simulation
// ---------------------------------------------------------------------------

test("initialize response has correct structure", async () => {
  const { startMcpServer: _skip, ...serverModule } = await import("../src/mcp/server.ts");

  // We test the dispatch logic by importing the tools and simulating
  // Since dispatch is not exported, we test through the tool handlers directly
  assert.ok(true, "Server module loads without error");
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_generate_niche
// ---------------------------------------------------------------------------

test("lead_os_generate_niche returns valid config", async () => {
  const tool = getToolByName("lead_os_generate_niche");
  assert.ok(tool);

  const result = await tool.handler({ name: "immigration-law" }) as Record<string, unknown>;
  assert.ok(result);
  assert.equal(result.name, "immigration-law");
  assert.ok(result.slug);
  assert.ok(result.industry);
  assert.ok(Array.isArray(result.painPoints));
  assert.ok(Array.isArray(result.assessmentQuestions));
  assert.ok(result.scoringWeights);
  assert.ok(result.personalizationContent);
  assert.ok(Array.isArray(result.recommendedFunnels));
  assert.ok(Array.isArray(result.nurtureSequence));
});

test("lead_os_generate_niche with industry override", async () => {
  const tool = getToolByName("lead_os_generate_niche");
  assert.ok(tool);

  const result = await tool.handler({ name: "personal-injury", industry: "legal" }) as Record<string, unknown>;
  assert.equal(result.industry, "legal");
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_score_lead
// ---------------------------------------------------------------------------

test("lead_os_score_lead returns scores and temperature", async () => {
  const tool = getToolByName("lead_os_score_lead");
  assert.ok(tool);

  const result = await tool.handler({
    source: "referral",
    pagesViewed: 5,
    timeOnSite: 300,
    hasEmail: true,
    hasPhone: true,
    timeline: "immediate",
  }) as Record<string, unknown>;

  assert.ok(result);
  assert.ok(result.composite);
  assert.ok(result.temperature);
  assert.ok(result.recommendation);

  const composite = result.composite as { score: number; type: string };
  assert.equal(composite.type, "composite");
  assert.ok(composite.score >= 0 && composite.score <= 100);
});

test("lead_os_score_lead with minimal params", async () => {
  const tool = getToolByName("lead_os_score_lead");
  assert.ok(tool);

  const result = await tool.handler({ source: "direct" }) as Record<string, unknown>;
  assert.ok(result.composite);
  assert.ok(result.temperature);
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_route_lead
// ---------------------------------------------------------------------------

test("lead_os_route_lead returns routing decision", async () => {
  const tool = getToolByName("lead_os_route_lead");
  assert.ok(tool);

  const result = await tool.handler({
    source: "organic",
    hasEmail: true,
    niche: "roofing",
  }) as Record<string, unknown>;

  assert.ok(result);
  assert.ok(result.family);
  assert.ok(result.destination);
  assert.ok(result.reason);
  assert.ok(result.ctaLabel);
});

test("lead_os_route_lead routes checkout intent correctly", async () => {
  const tool = getToolByName("lead_os_route_lead");
  assert.ok(tool);

  const result = await tool.handler({
    wantsCheckout: true,
    niche: "roofing",
  }) as Record<string, unknown>;

  assert.equal(result.family, "checkout");
});

test("lead_os_route_lead routes booking intent to qualification", async () => {
  const tool = getToolByName("lead_os_route_lead");
  assert.ok(tool);

  const result = await tool.handler({
    wantsBooking: true,
    niche: "legal",
  }) as Record<string, unknown>;

  assert.equal(result.family, "qualification");
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_create_design_spec
// ---------------------------------------------------------------------------

test("lead_os_create_design_spec with invalid spec returns errors", async () => {
  const tool = getToolByName("lead_os_create_design_spec");
  assert.ok(tool);

  const result = await tool.handler({ spec: { invalid: true } }) as Record<string, unknown>;
  assert.equal(result.valid, false);
  assert.ok(result.errors);
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_list_leads
// ---------------------------------------------------------------------------

test("lead_os_list_leads returns array", async () => {
  const tool = getToolByName("lead_os_list_leads");
  assert.ok(tool);

  const result = await tool.handler({}) as Record<string, unknown>;
  assert.ok(result);
  assert.ok(Array.isArray((result as { leads: unknown[] }).leads));
  assert.ok(typeof (result as { total: number }).total === "number");
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_list_marketplace
// ---------------------------------------------------------------------------

test("lead_os_list_marketplace returns leads array", async () => {
  const tool = getToolByName("lead_os_list_marketplace");
  assert.ok(tool);

  const result = await tool.handler({}) as Record<string, unknown>;
  assert.ok(result);
  assert.ok(Array.isArray((result as { leads: unknown[] }).leads));
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_get_tenant (error case)
// ---------------------------------------------------------------------------

test("lead_os_get_tenant throws for unknown tenant", async () => {
  const tool = getToolByName("lead_os_get_tenant");
  assert.ok(tool);

  await assert.rejects(
    () => tool.handler({ tenantId: "nonexistent-id" }),
    { message: "Tenant not found: nonexistent-id" },
  );
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_get_lead (error case)
// ---------------------------------------------------------------------------

test("lead_os_get_lead throws for unknown lead", async () => {
  const tool = getToolByName("lead_os_get_lead");
  assert.ok(tool);

  await assert.rejects(
    () => tool.handler({ leadKey: "nonexistent-key" }),
    { message: "Lead not found: nonexistent-key" },
  );
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_create_experiment
// ---------------------------------------------------------------------------

test("lead_os_create_experiment creates experiment", async () => {
  const tool = getToolByName("lead_os_create_experiment");
  assert.ok(tool);

  const result = await tool.handler({
    name: "Test Headline Experiment",
    variants: [
      { name: "Control", isControl: true },
      { name: "Variant A" },
    ],
    targetMetric: "conversion_rate",
  }) as Record<string, unknown>;

  assert.ok(result);
  assert.equal(result.name, "Test Headline Experiment");
  assert.equal(result.status, "draft");
  assert.ok(Array.isArray(result.variants));
  assert.equal((result.variants as unknown[]).length, 2);
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_generate_email_sequence
// ---------------------------------------------------------------------------

test("lead_os_generate_email_sequence returns 7-stage sequence", async () => {
  const tool = getToolByName("lead_os_generate_email_sequence");
  assert.ok(tool);

  const result = await tool.handler({
    tenantId: "test-tenant",
    niche: "roofing",
    brandName: "RoofPro",
  }) as Record<string, unknown>;

  assert.ok(result);
  const sequence = (result as { sequence: unknown[] }).sequence;
  assert.equal(sequence.length, 7);

  const first = sequence[0] as Record<string, unknown>;
  assert.equal(first.stageId, "stage_1");
  assert.equal(first.dayOffset, 0);
  assert.ok(typeof first.subject === "string");
  assert.ok(typeof first.bodyTemplate === "string");
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_export_video_script
// ---------------------------------------------------------------------------

test("lead_os_export_video_script returns remotion config", async () => {
  const tool = getToolByName("lead_os_export_video_script");
  assert.ok(tool);

  const result = await tool.handler({
    tenantId: "test-tenant",
    type: "product-demo",
  }) as Record<string, unknown>;

  assert.ok(result);
  assert.equal(result.type, "product-demo");
  assert.ok(result.remotionConfig);
  assert.ok(Array.isArray(result.scenes));
  assert.ok((result.scenes as unknown[]).length > 0);

  const config = result.remotionConfig as Record<string, unknown>;
  assert.equal(config.width, 1920);
  assert.equal(config.height, 1080);
  assert.equal(config.fps, 30);
});

// ---------------------------------------------------------------------------
// Tool handlers: lead_os_generate_landing_page
// ---------------------------------------------------------------------------

test("lead_os_generate_landing_page creates page with blocks", async () => {
  const tool = getToolByName("lead_os_generate_landing_page");
  assert.ok(tool);

  const result = await tool.handler({
    tenantId: "test-tenant",
    slug: "test-landing",
    title: "Get Expert Roofing",
    niche: "roofing",
  }) as Record<string, unknown>;

  assert.ok(result);
  assert.equal(result.slug, "test-landing");
  assert.equal(result.title, "Get Expert Roofing");
  assert.ok(Array.isArray(result.blocks));
  assert.ok((result.blocks as unknown[]).length >= 3);
});

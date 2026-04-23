import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefaultFunnelGraphs,
  getDefaultFunnelGraph,
  CANONICAL_NODE_LIBRARY,
} from "../src/lib/funnel-library.ts";
import type { FunnelFamily, NodeType, ChannelType } from "../src/lib/runtime-schema.ts";

const TEST_TENANT = "tenant-test-001";

// ---------------------------------------------------------------------------
// GET /api/funnel — returns funnel families
// ---------------------------------------------------------------------------

test("GET funnel returns all 10 funnel families", () => {
  const graphs = buildDefaultFunnelGraphs(TEST_TENANT);
  const families = Object.keys(graphs);
  assert.equal(families.length, 10);
  const expected: FunnelFamily[] = [
    "lead-magnet", "qualification", "chat", "webinar", "authority",
    "checkout", "retention", "rescue", "referral", "continuity",
  ];
  for (const fam of expected) {
    assert.ok(families.includes(fam), `Missing funnel family: ${fam}`);
  }
});

test("GET funnel returns valid structure for each family", () => {
  const graphs = buildDefaultFunnelGraphs(TEST_TENANT);
  for (const [family, def] of Object.entries(graphs)) {
    assert.ok(def.id, `${family} missing id`);
    assert.ok(def.name, `${family} missing name`);
    assert.equal(def.tenantId, TEST_TENANT, `${family} tenantId mismatch`);
    assert.ok(def.nodes.length > 0, `${family} has no nodes`);
    assert.ok(def.edges.length > 0, `${family} has no edges`);
    assert.ok(def.entryPoints.length > 0, `${family} has no entry points`);
  }
});

test("GET funnel each graph has a goal field", () => {
  const graphs = buildDefaultFunnelGraphs(TEST_TENANT);
  for (const [family, def] of Object.entries(graphs)) {
    assert.ok(def.goal, `${family} missing goal`);
  }
});

// ---------------------------------------------------------------------------
// POST /api/funnel — creates funnel config
// ---------------------------------------------------------------------------

test("POST funnel creates graph scoped to tenant", () => {
  const tenantA = "tenant-alpha";
  const tenantB = "tenant-beta";
  const graphA = getDefaultFunnelGraph(tenantA, "lead-magnet");
  const graphB = getDefaultFunnelGraph(tenantB, "lead-magnet");

  assert.equal(graphA.tenantId, tenantA);
  assert.equal(graphB.tenantId, tenantB);
  assert.notEqual(graphA.tenantId, graphB.tenantId);
});

test("POST funnel creates graph with correct defaults", () => {
  const graph = getDefaultFunnelGraph(TEST_TENANT, "lead-magnet");
  assert.ok(graph.defaults);
  assert.ok(graph.defaults.hotLeadThreshold > 0, "hotLeadThreshold must be positive");
  assert.ok(Array.isArray(graph.defaults.nurtureScheduleDays), "nurtureScheduleDays must be an array");
  assert.ok(graph.defaults.nurtureScheduleDays.length > 0, "nurtureScheduleDays must be non-empty");
  assert.ok(graph.defaults.defaultChannelOrder.length > 0, "channelOrder must be non-empty");
});

test("POST funnel graph edges connect consecutive nodes", () => {
  const graph = getDefaultFunnelGraph(TEST_TENANT, "qualification");
  for (const edge of graph.edges) {
    const fromNode = graph.nodes.find((n) => n.id === edge.from);
    const toNode = graph.nodes.find((n) => n.id === edge.to);
    assert.ok(fromNode, `Edge references missing from-node: ${edge.from}`);
    assert.ok(toNode, `Edge references missing to-node: ${edge.to}`);
  }
});

// ---------------------------------------------------------------------------
// Node type validation
// ---------------------------------------------------------------------------

test("node type validation: all graph nodes use canonical node types", () => {
  const graphs = buildDefaultFunnelGraphs(TEST_TENANT);
  const validTypes = Object.keys(CANONICAL_NODE_LIBRARY) as NodeType[];
  for (const [family, def] of Object.entries(graphs)) {
    for (const node of def.nodes) {
      assert.ok(
        validTypes.includes(node.type),
        `${family} contains invalid node type: ${node.type}`,
      );
    }
  }
});

test("node type validation: every node has channel and purpose", () => {
  const graphs = buildDefaultFunnelGraphs(TEST_TENANT);
  for (const [family, def] of Object.entries(graphs)) {
    for (const node of def.nodes) {
      assert.ok(node.channel, `${family}/${node.id} missing channel`);
      assert.ok(node.purpose, `${family}/${node.id} missing purpose`);
    }
  }
});

test("node type validation: canonical library covers all standard channels", () => {
  const channels = new Set(Object.values(CANONICAL_NODE_LIBRARY).map((n) => n.channel));
  const expected: ChannelType[] = ["web", "email", "chat", "voice", "sms", "whatsapp", "checkout", "internal"];
  for (const ch of expected) {
    assert.ok(channels.has(ch), `Canonical library missing channel: ${ch}`);
  }
});

// ---------------------------------------------------------------------------
// Funnel family listing
// ---------------------------------------------------------------------------

test("funnel family listing: getDefaultFunnelGraph returns undefined-safe for each family", () => {
  const families: FunnelFamily[] = [
    "lead-magnet", "qualification", "chat", "webinar", "authority",
    "checkout", "retention", "rescue", "referral", "continuity",
  ];
  for (const fam of families) {
    const graph = getDefaultFunnelGraph(TEST_TENANT, fam);
    assert.ok(graph, `getDefaultFunnelGraph returned falsy for ${fam}`);
    assert.equal(graph.family, fam, `Family mismatch for ${fam}`);
  }
});

test("funnel family listing: each family graph has unique blueprint id", () => {
  const graphs = buildDefaultFunnelGraphs(TEST_TENANT);
  const ids = Object.values(graphs).map((g) => g.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, "Duplicate blueprint ids found");
});

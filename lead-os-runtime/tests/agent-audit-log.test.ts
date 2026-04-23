import test from "node:test";
import assert from "node:assert/strict";
import {
  logAgentAction,
  getAuditLog,
  getTeamAuditLog,
  getTenantAuditLog,
  getAuditSummary,
  resetAuditStore,
} from "../src/lib/agent-audit-log.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedAuditEntries() {
  const tenantId = `tenant-${Date.now()}`;
  const teamId = `team-${Date.now()}`;
  const agentId = `agent-${Date.now()}`;

  await logAgentAction({
    tenantId,
    teamId,
    agentId,
    action: "prospect-search",
    input: { query: "construction leads" },
    output: { count: 10 },
    tokensUsed: 1500,
    costUsd: 0.0045,
    status: "success",
    metadata: { agentName: "Lead Researcher" },
  });

  await logAgentAction({
    tenantId,
    teamId,
    agentId,
    action: "enrich-data",
    input: { leadId: "lead-1" },
    tokensUsed: 800,
    costUsd: 0.0024,
    status: "success",
    metadata: { agentName: "Lead Researcher" },
  });

  await logAgentAction({
    tenantId,
    teamId,
    agentId,
    action: "qualify-lead",
    tokensUsed: 500,
    costUsd: 0.0015,
    status: "failure",
    metadata: { agentName: "Lead Researcher" },
  });

  return { tenantId, teamId, agentId };
}

// ---------------------------------------------------------------------------
// Logging and retrieval
// ---------------------------------------------------------------------------

test("logAgentAction stores entry and getAuditLog retrieves it", async () => {
  resetAuditStore();
  const { agentId } = await seedAuditEntries();

  const entries = await getAuditLog(agentId);
  assert.equal(entries.length, 3);
  assert.ok(entries[0].id);
  assert.ok(entries[0].timestamp);
});

test("getTeamAuditLog filters by teamId", async () => {
  resetAuditStore();
  const { teamId } = await seedAuditEntries();

  const entries = await getTeamAuditLog(teamId);
  assert.equal(entries.length, 3);
  for (const e of entries) {
    assert.equal(e.teamId, teamId);
  }
});

test("getTenantAuditLog filters by tenantId", async () => {
  resetAuditStore();
  const { tenantId } = await seedAuditEntries();

  const entries = await getTenantAuditLog(tenantId);
  assert.equal(entries.length, 3);
});

test("getAuditLog respects limit and offset", async () => {
  resetAuditStore();
  const { agentId } = await seedAuditEntries();

  const first = await getAuditLog(agentId, { limit: 1 });
  assert.equal(first.length, 1);

  const second = await getAuditLog(agentId, { limit: 1, offset: 1 });
  assert.equal(second.length, 1);
  assert.notEqual(first[0].id, second[0].id);
});

// ---------------------------------------------------------------------------
// Audit summary
// ---------------------------------------------------------------------------

test("getAuditSummary computes correct stats", async () => {
  resetAuditStore();
  const { tenantId } = await seedAuditEntries();

  const summary = await getAuditSummary(tenantId, "30d");
  assert.equal(summary.period, "30d");
  assert.equal(summary.totalActions, 3);
  assert.equal(summary.successRate, 67);
  assert.ok(summary.totalCost > 0);
  assert.ok(summary.topAgents.length > 0);
  assert.ok(summary.topActions.length > 0);

  const failEntry = summary.topActions.find((a) => a.action === "qualify-lead");
  assert.ok(failEntry);
  assert.equal(failEntry.count, 1);
});

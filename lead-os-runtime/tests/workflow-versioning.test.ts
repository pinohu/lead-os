import test from "node:test";
import assert from "node:assert/strict";
import {
  recordWorkflowVersion,
  getWorkflowVersions,
  getWorkflowVersion,
  getLatestVersion,
  diffVersions,
  rollbackWorkflow,
  getWorkflowInvestmentReport,
  listTenantWorkflows,
  resetWorkflowVersionStore,
} from "../src/lib/workflow-versioning.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tid() {
  return `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slug(name = "lead-capture") {
  return `${name}-${Math.random().toString(36).slice(2, 7)}`;
}

function snap(fields: Record<string, unknown> = {}): Record<string, unknown> {
  return { name: "Test Workflow", nodes: [], connections: {}, ...fields };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("version increments from 1 on first record", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  const v = await recordWorkflowVersion(
    tenantId,
    workflowSlug,
    snap(),
    "created",
    "Initial creation",
    "operator@example.com",
  );

  assert.equal(v.version, 1);
  assert.equal(v.tenantId, tenantId);
  assert.equal(v.workflowSlug, workflowSlug);
  assert.equal(v.changeType, "created");
  assert.equal(v.changedBy, "operator@example.com");
});

test("version auto-increments on successive records", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  const v1 = await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "created", "sys");
  const v2 = await recordWorkflowVersion(tenantId, workflowSlug, snap({ name: "v2" }), "updated", "updated name", "sys");
  const v3 = await recordWorkflowVersion(tenantId, workflowSlug, snap({ name: "v3" }), "activated", "activated", "sys");

  assert.equal(v1.version, 1);
  assert.equal(v2.version, 2);
  assert.equal(v3.version, 3);
});

test("multiple workflows for same tenant tracked independently", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const slugA = slug("alpha");
  const slugB = slug("beta");

  await recordWorkflowVersion(tenantId, slugA, snap(), "created", "alpha v1", "sys");
  await recordWorkflowVersion(tenantId, slugA, snap({ x: 1 }), "updated", "alpha v2", "sys");
  await recordWorkflowVersion(tenantId, slugB, snap(), "created", "beta v1", "sys");

  const vA = await getLatestVersion(tenantId, slugA);
  const vB = await getLatestVersion(tenantId, slugB);

  assert.equal(vA?.version, 2);
  assert.equal(vB?.version, 1);
});

test("different tenants do not share version counters", async () => {
  resetWorkflowVersionStore();
  const workflowSlug = slug("shared-name");
  const tenantA = tid();
  const tenantB = tid();

  await recordWorkflowVersion(tenantA, workflowSlug, snap(), "created", "A v1", "sys");
  await recordWorkflowVersion(tenantA, workflowSlug, snap(), "updated", "A v2", "sys");
  const vB = await recordWorkflowVersion(tenantB, workflowSlug, snap(), "created", "B v1", "sys");

  assert.equal(vB.version, 1);
});

test("getWorkflowVersions returns all versions sorted desc", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  for (let i = 0; i < 5; i++) {
    await recordWorkflowVersion(tenantId, workflowSlug, snap({ i }), "updated", `change ${i}`, "sys");
  }

  const versions = await getWorkflowVersions(tenantId, workflowSlug);

  assert.equal(versions.length, 5);
  assert.equal(versions[0].version, 5);
  assert.equal(versions[4].version, 1);

  for (let i = 0; i < versions.length - 1; i++) {
    assert.ok(versions[i].version > versions[i + 1].version);
  }
});

test("getWorkflowVersions returns empty array for unknown workflow", async () => {
  resetWorkflowVersionStore();
  const versions = await getWorkflowVersions("no-such-tenant", "no-such-slug");
  assert.deepEqual(versions, []);
});

test("getWorkflowVersion returns correct specific version", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap({ v: 1 }), "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap({ v: 2 }), "updated", "v2", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap({ v: 3 }), "updated", "v3", "sys");

  const v2 = await getWorkflowVersion(tenantId, workflowSlug, 2);
  assert.ok(v2);
  assert.equal(v2.version, 2);
  assert.equal(v2.snapshot.v, 2);
});

test("getWorkflowVersion returns null for missing version", async () => {
  resetWorkflowVersionStore();
  const result = await getWorkflowVersion("t1", "no-slug", 99);
  assert.equal(result, null);
});

test("getLatestVersion returns highest version number", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap(), "updated", "v2", "sys");

  const latest = await getLatestVersion(tenantId, workflowSlug);
  assert.ok(latest);
  assert.equal(latest.version, 2);
});

test("getLatestVersion returns null for unknown workflow", async () => {
  resetWorkflowVersionStore();
  const latest = await getLatestVersion("ghost-tenant", "ghost-slug");
  assert.equal(latest, null);
});

test("diff detects changed fields", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap({ name: "Old Name", active: false }), "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap({ name: "New Name", active: false }), "updated", "v2", "sys");

  const diff = await diffVersions(tenantId, workflowSlug, 1, 2);

  assert.equal(diff.fromVersion, 1);
  assert.equal(diff.toVersion, 2);

  const nameChange = diff.changes.find((c) => c.field === "name");
  assert.ok(nameChange, "name field should appear in diff");
  assert.equal(nameChange.oldValue, "Old Name");
  assert.equal(nameChange.newValue, "New Name");
});

test("diff detects added fields", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, { name: "W" }, "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, { name: "W", tags: ["a", "b"] }, "updated", "v2", "sys");

  const diff = await diffVersions(tenantId, workflowSlug, 1, 2);
  const tagsChange = diff.changes.find((c) => c.field === "tags");
  assert.ok(tagsChange, "tags field should appear as added");
  assert.equal(tagsChange.oldValue, null);
  assert.deepEqual(tagsChange.newValue, ["a", "b"]);
});

test("diff detects removed fields", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, { name: "W", deprecated: true }, "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, { name: "W" }, "updated", "v2", "sys");

  const diff = await diffVersions(tenantId, workflowSlug, 1, 2);
  const removedField = diff.changes.find((c) => c.field === "deprecated");
  assert.ok(removedField, "deprecated field should appear as removed");
  assert.equal(removedField.oldValue, true);
  assert.equal(removedField.newValue, null);
});

test("diff returns empty changes when snapshots are identical", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();
  const identical = snap({ name: "Same", active: true });

  await recordWorkflowVersion(tenantId, workflowSlug, identical, "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, identical, "updated", "v2", "sys");

  const diff = await diffVersions(tenantId, workflowSlug, 1, 2);
  assert.equal(diff.changes.length, 0);
});

test("rollback creates a new version with old snapshot", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap({ name: "Original" }), "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap({ name: "Modified" }), "updated", "v2", "sys");

  const rolled = await rollbackWorkflow(tenantId, workflowSlug, 1, "admin@example.com");

  assert.equal(rolled.version, 3);
  assert.equal(rolled.changeType, "rollback");
  assert.equal(rolled.snapshot.name, "Original");
  assert.equal(rolled.changedBy, "admin@example.com");
  assert.ok(rolled.changeSummary.includes("1"));
});

test("rollback to non-existent version throws", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "v1", "sys");

  await assert.rejects(
    () => rollbackWorkflow(tenantId, workflowSlug, 99, "admin@example.com"),
    /not found/i,
  );
});

test("investment report calculates correctly for single workflow", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap({ x: 1 }), "updated", "v2", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, snap({ x: 2 }), "updated", "v3", "sys");

  const report = await getWorkflowInvestmentReport(tenantId);

  assert.equal(report.tenantId, tenantId);
  assert.equal(report.totalWorkflows, 1);
  assert.equal(report.totalVersions, 3);
  assert.equal(report.totalChanges, 3);
  assert.equal(report.estimatedHoursInvested, 1.5);
  assert.equal(report.mostModifiedWorkflow.slug, workflowSlug);
  assert.equal(report.mostModifiedWorkflow.versions, 3);
});

test("investment report picks most-modified workflow correctly", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const slugA = slug("a");
  const slugB = slug("b");

  await recordWorkflowVersion(tenantId, slugA, snap(), "created", "a v1", "sys");
  for (let i = 0; i < 5; i++) {
    await recordWorkflowVersion(tenantId, slugB, snap({ i }), "updated", `b v${i + 1}`, "sys");
  }

  const report = await getWorkflowInvestmentReport(tenantId);

  assert.equal(report.totalWorkflows, 2);
  assert.equal(report.mostModifiedWorkflow.slug, slugB);
  assert.equal(report.mostModifiedWorkflow.versions, 5);
});

test("empty tenant returns zero-value investment report", async () => {
  resetWorkflowVersionStore();
  const report = await getWorkflowInvestmentReport("empty-tenant-xyz");

  assert.equal(report.totalWorkflows, 0);
  assert.equal(report.totalVersions, 0);
  assert.equal(report.totalChanges, 0);
  assert.equal(report.estimatedHoursInvested, 0);
  assert.equal(report.oldestWorkflow, "");
  assert.equal(report.newestWorkflow, "");
  assert.equal(report.mostModifiedWorkflow.slug, "");
});

test("listTenantWorkflows returns unique slugs with latest version", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const slugA = slug("x");
  const slugB = slug("y");

  await recordWorkflowVersion(tenantId, slugA, snap(), "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, slugA, snap(), "updated", "v2", "sys");
  await recordWorkflowVersion(tenantId, slugB, snap(), "created", "v1", "sys");

  const workflows = await listTenantWorkflows(tenantId);

  assert.equal(workflows.length, 2);
  const wA = workflows.find((w) => w.slug === slugA);
  const wB = workflows.find((w) => w.slug === slugB);
  assert.ok(wA);
  assert.ok(wB);
  assert.equal(wA.latestVersion, 2);
  assert.equal(wB.latestVersion, 1);
});

test("listTenantWorkflows returns empty array for unknown tenant", async () => {
  resetWorkflowVersionStore();
  const workflows = await listTenantWorkflows("phantom-tenant");
  assert.deepEqual(workflows, []);
});

test("resetWorkflowVersionStore clears all data", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "v1", "sys");
  const before = await getWorkflowVersions(tenantId, workflowSlug);
  assert.equal(before.length, 1);

  resetWorkflowVersionStore();

  const after = await getWorkflowVersions(tenantId, workflowSlug);
  assert.equal(after.length, 0);
});

test("reset does not affect independently seeded data after re-seed", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  resetWorkflowVersionStore();
  await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "fresh start", "sys");

  const versions = await getWorkflowVersions(tenantId, workflowSlug);
  assert.equal(versions.length, 1);
  assert.equal(versions[0].version, 1);
});

test("each recorded version has a unique id", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  const v1 = await recordWorkflowVersion(tenantId, workflowSlug, snap(), "created", "v1", "sys");
  const v2 = await recordWorkflowVersion(tenantId, workflowSlug, snap(), "updated", "v2", "sys");
  const v3 = await recordWorkflowVersion(tenantId, workflowSlug, snap(), "updated", "v3", "sys");

  const ids = new Set([v1.id, v2.id, v3.id]);
  assert.equal(ids.size, 3);
});

test("rollback preserves snapshot fidelity through multiple hops", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const workflowSlug = slug();

  const originalSnap = { name: "Origin", nodes: [{ id: "n1", type: "webhook" }], tags: ["v1"] };
  await recordWorkflowVersion(tenantId, workflowSlug, originalSnap, "created", "v1", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, { ...originalSnap, name: "Modified" }, "updated", "v2", "sys");
  await recordWorkflowVersion(tenantId, workflowSlug, { ...originalSnap, name: "Modified Again" }, "updated", "v3", "sys");

  // Rollback twice
  await rollbackWorkflow(tenantId, workflowSlug, 1, "sys");   // v4 = snapshot of v1
  const v5 = await rollbackWorkflow(tenantId, workflowSlug, 4, "sys"); // v5 = snapshot of v4 (= v1)

  assert.equal(v5.version, 5);
  assert.deepEqual(v5.snapshot, originalSnap);
});

test("investment report oldestWorkflow and newestWorkflow are different when multiple slugs exist", async () => {
  resetWorkflowVersionStore();
  const tenantId = tid();
  const slugFirst = slug("first");
  const slugLast = slug("last");

  await recordWorkflowVersion(tenantId, slugFirst, snap(), "created", "first", "sys");
  // Small delay to ensure createdAt timestamps differ
  await new Promise((r) => setTimeout(r, 2));
  await recordWorkflowVersion(tenantId, slugLast, snap(), "created", "last", "sys");

  const report = await getWorkflowInvestmentReport(tenantId);

  assert.equal(report.totalWorkflows, 2);
  assert.equal(report.oldestWorkflow, slugFirst);
  assert.equal(report.newestWorkflow, slugLast);
});

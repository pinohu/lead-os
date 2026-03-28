import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getExecutionStatus,
  listExecutions,
  createLeadIntakeWorkflow,
  createLeadRoutingWorkflow,
  createLeadNurtureSequence,
  createLeadHandoffWorkflow,
  resetFlowForgeStore,
} from "../src/lib/integrations/flow-forge-adapter.ts";

// ---------------------------------------------------------------------------
// createWorkflow + getWorkflow
// ---------------------------------------------------------------------------

test("createWorkflow creates a workflow and getWorkflow retrieves it", async () => {
  resetFlowForgeStore();
  const wf = await createWorkflow("ff-t1", {
    name: "Test Workflow",
    trigger: { type: "webhook", config: { path: "/test" } },
    steps: [{ id: "s1", name: "Log", type: "action", action: "log", config: { msg: "hi" } }],
    errorHandling: "stop",
  });

  assert.ok(wf.id.startsWith("wf-"));
  assert.equal(wf.tenantId, "ff-t1");
  assert.equal(wf.name, "Test Workflow");
  assert.equal(wf.status, "draft");
  assert.equal(wf.executionCount, 0);
  assert.ok(wf.createdAt);

  const retrieved = await getWorkflow(wf.id);
  assert.equal(retrieved.id, wf.id);
});

// ---------------------------------------------------------------------------
// listWorkflows
// ---------------------------------------------------------------------------

test("listWorkflows returns workflows scoped to tenant", async () => {
  resetFlowForgeStore();
  await createWorkflow("ff-ta", {
    name: "WF A",
    trigger: { type: "manual", config: {} },
    steps: [{ id: "s1", name: "S1", type: "action", config: {} }],
    errorHandling: "stop",
  });
  await createWorkflow("ff-tb", {
    name: "WF B",
    trigger: { type: "manual", config: {} },
    steps: [{ id: "s1", name: "S1", type: "action", config: {} }],
    errorHandling: "stop",
  });

  const taWfs = await listWorkflows("ff-ta");
  const tbWfs = await listWorkflows("ff-tb");
  assert.equal(taWfs.length, 1);
  assert.equal(tbWfs.length, 1);
});

// ---------------------------------------------------------------------------
// updateWorkflow
// ---------------------------------------------------------------------------

test("updateWorkflow modifies workflow properties", async () => {
  resetFlowForgeStore();
  const wf = await createWorkflow("ff-t2", {
    name: "Original Name",
    trigger: { type: "manual", config: {} },
    steps: [{ id: "s1", name: "S1", type: "action", config: {} }],
    errorHandling: "stop",
  });

  const updated = await updateWorkflow(wf.id, { name: "Renamed Workflow" });
  assert.equal(updated.name, "Renamed Workflow");
});

// ---------------------------------------------------------------------------
// deleteWorkflow
// ---------------------------------------------------------------------------

test("deleteWorkflow removes a workflow from the store", async () => {
  resetFlowForgeStore();
  const wf = await createWorkflow("ff-t3", {
    name: "Delete Me",
    trigger: { type: "manual", config: {} },
    steps: [{ id: "s1", name: "S1", type: "action", config: {} }],
    errorHandling: "stop",
  });

  await deleteWorkflow(wf.id);
  await assert.rejects(() => getWorkflow(wf.id), /not found/);
});

// ---------------------------------------------------------------------------
// executeWorkflow + getExecutionStatus + listExecutions
// ---------------------------------------------------------------------------

test("executeWorkflow creates an execution and updates workflow stats", async () => {
  resetFlowForgeStore();
  const wf = await createWorkflow("ff-t4", {
    name: "Execute Me",
    trigger: { type: "manual", config: {} },
    steps: [
      { id: "s1", name: "Step One", type: "action", action: "process", config: {} },
      { id: "s2", name: "Step Two", type: "action", action: "notify", config: {} },
    ],
    errorHandling: "stop",
  });

  const exec = await executeWorkflow(wf.id, { lead: "test@example.com" });
  assert.ok(exec.id.startsWith("exec-"));
  assert.equal(exec.workflowId, wf.id);
  assert.equal(exec.status, "completed");
  assert.deepEqual(exec.input, { lead: "test@example.com" });
  assert.equal(exec.stepResults.length, 2);
  assert.ok(exec.startedAt);
  assert.ok(exec.completedAt);

  const status = await getExecutionStatus(exec.id);
  assert.equal(status.id, exec.id);

  const updatedWf = await getWorkflow(wf.id);
  assert.equal(updatedWf.executionCount, 1);
  assert.ok(updatedWf.lastRunAt);

  const execs = await listExecutions(wf.id);
  assert.equal(execs.length, 1);
});

// ---------------------------------------------------------------------------
// createLeadIntakeWorkflow
// ---------------------------------------------------------------------------

test("createLeadIntakeWorkflow builds an intake workflow", async () => {
  resetFlowForgeStore();
  const wf = await createLeadIntakeWorkflow("ff-t5");

  assert.equal(wf.name, "Lead Intake");
  assert.equal(wf.trigger.type, "webhook");
  assert.ok(wf.steps.length >= 4);
  assert.ok(wf.steps.some((s) => s.action === "validate-lead"));
  assert.ok(wf.steps.some((s) => s.action === "score-lead"));
});

// ---------------------------------------------------------------------------
// createLeadRoutingWorkflow
// ---------------------------------------------------------------------------

test("createLeadRoutingWorkflow builds a routing workflow with rules", async () => {
  resetFlowForgeStore();
  const wf = await createLeadRoutingWorkflow("ff-t6", [
    { condition: "score > 80", assignTo: "senior-rep", priority: 1 },
    { condition: "score > 50", assignTo: "standard-rep", priority: 2 },
  ]);

  assert.equal(wf.name, "Lead Routing");
  assert.equal(wf.trigger.type, "event");
  assert.ok(wf.steps.length >= 3);
});

// ---------------------------------------------------------------------------
// createLeadNurtureSequence
// ---------------------------------------------------------------------------

test("createLeadNurtureSequence builds a multi-stage sequence", async () => {
  resetFlowForgeStore();
  const wf = await createLeadNurtureSequence("ff-t7", [
    { name: "Welcome", delay: "0d", channel: "email", template: "welcome" },
    { name: "Follow Up", delay: "3d", channel: "sms", template: "followup", exitCondition: "converted" },
  ]);

  assert.equal(wf.name, "Lead Nurture Sequence");
  assert.equal(wf.trigger.type, "event");
  assert.ok(wf.steps.length >= 4);
  assert.ok(wf.steps.some((s) => s.action === "send-email"));
  assert.ok(wf.steps.some((s) => s.action === "send-sms"));
});

// ---------------------------------------------------------------------------
// createLeadHandoffWorkflow
// ---------------------------------------------------------------------------

test("createLeadHandoffWorkflow builds a CRM handoff workflow", async () => {
  resetFlowForgeStore();
  const wf = await createLeadHandoffWorkflow("ff-t8", "hubspot");

  assert.ok(wf.name.includes("hubspot"));
  assert.equal(wf.trigger.type, "event");
  assert.ok(wf.steps.some((s) => s.action === "sync-to-hubspot"));
  assert.ok(wf.steps.some((s) => s.action === "map-crm-fields"));
});

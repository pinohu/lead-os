import test from "node:test";
import assert from "node:assert/strict";
import {
  createFlow,
  listFlows,
  getFlow,
  toggleFlow,
  deleteFlow,
  triggerFlow,
  getFlowRuns,
  createLeadNurtureWorkflow,
  createLeadScoringWorkflow,
  createCRMSyncWorkflow,
  createEmailSequenceWorkflow,
  createWebhookWorkflow,
  resetActivepiecesStore,
  _getFlowStoreForTesting,
  _getFlowRunStoreForTesting,
} from "../src/lib/integrations/activepieces-adapter.ts";

// ---------------------------------------------------------------------------
// createFlow + getFlow
// ---------------------------------------------------------------------------

test("createFlow creates a flow and getFlow retrieves it", async () => {
  resetActivepiecesStore();
  const flow = await createFlow("tenant-1", {
    name: "Test Flow",
    trigger: { type: "webhook", config: { path: "/test" } },
    steps: [{ type: "action", action: "log", config: { message: "hello" } }],
  });

  assert.ok(flow.id);
  assert.equal(flow.tenantId, "tenant-1");
  assert.equal(flow.name, "Test Flow");
  assert.equal(flow.enabled, true);
  assert.equal(flow.trigger.type, "webhook");
  assert.equal(flow.steps.length, 1);
  assert.ok(flow.createdAt);
  assert.equal(flow.lastRunAt, null);

  const retrieved = await getFlow(flow.id);
  assert.equal(retrieved.id, flow.id);
  assert.equal(retrieved.name, flow.name);
});

// ---------------------------------------------------------------------------
// listFlows
// ---------------------------------------------------------------------------

test("listFlows returns flows scoped to tenant", async () => {
  resetActivepiecesStore();
  await createFlow("t1", {
    name: "Flow A",
    trigger: { type: "webhook", config: {} },
    steps: [],
  });
  await createFlow("t2", {
    name: "Flow B",
    trigger: { type: "schedule", config: { cron: "0 * * * *" } },
    steps: [],
  });
  await createFlow("t1", {
    name: "Flow C",
    trigger: { type: "event", config: { event: "lead.captured" } },
    steps: [],
  });

  const t1Flows = await listFlows("t1");
  const t2Flows = await listFlows("t2");

  assert.equal(t1Flows.length, 2);
  assert.equal(t2Flows.length, 1);
  assert.equal(t2Flows[0]!.name, "Flow B");
});

// ---------------------------------------------------------------------------
// toggleFlow
// ---------------------------------------------------------------------------

test("toggleFlow disables and re-enables a flow", async () => {
  resetActivepiecesStore();
  const flow = await createFlow("t1", {
    name: "Toggle Test",
    trigger: { type: "webhook", config: {} },
    steps: [],
  });

  assert.equal(flow.enabled, true);

  const disabled = await toggleFlow(flow.id, false);
  assert.equal(disabled.enabled, false);

  const enabled = await toggleFlow(flow.id, true);
  assert.equal(enabled.enabled, true);
});

// ---------------------------------------------------------------------------
// deleteFlow
// ---------------------------------------------------------------------------

test("deleteFlow removes a flow from the store", async () => {
  resetActivepiecesStore();
  const flow = await createFlow("t1", {
    name: "Delete Me",
    trigger: { type: "webhook", config: {} },
    steps: [],
  });

  await deleteFlow(flow.id);

  assert.equal(_getFlowStoreForTesting().has(flow.id), false);
  await assert.rejects(() => getFlow(flow.id), /not found/);
});

// ---------------------------------------------------------------------------
// triggerFlow + getFlowRuns
// ---------------------------------------------------------------------------

test("triggerFlow creates a run and updates lastRunAt", async () => {
  resetActivepiecesStore();
  const flow = await createFlow("t1", {
    name: "Trigger Test",
    trigger: { type: "webhook", config: {} },
    steps: [{ type: "action", action: "test", config: {} }],
  });

  const run = await triggerFlow(flow.id, { key: "value" });

  assert.ok(run.id);
  assert.equal(run.flowId, flow.id);
  assert.equal(run.status, "completed");
  assert.ok(run.startedAt);
  assert.ok(run.finishedAt);
  assert.deepEqual(run.output, { key: "value" });

  const updatedFlow = await getFlow(flow.id);
  assert.ok(updatedFlow.lastRunAt);
});

test("getFlowRuns returns runs for a flow", async () => {
  resetActivepiecesStore();
  const flow = await createFlow("t1", {
    name: "Runs Test",
    trigger: { type: "webhook", config: {} },
    steps: [],
  });

  await triggerFlow(flow.id, { run: 1 });
  await triggerFlow(flow.id, { run: 2 });

  const runs = await getFlowRuns(flow.id);
  assert.equal(runs.length, 2);
  assert.deepEqual(runs[0]!.output, { run: 2 });
  assert.deepEqual(runs[1]!.output, { run: 1 });
});

// ---------------------------------------------------------------------------
// Templates: Lead Nurture
// ---------------------------------------------------------------------------

test("createLeadNurtureWorkflow builds a nurture flow with stages", async () => {
  resetActivepiecesStore();
  const flow = await createLeadNurtureWorkflow("t1", {
    stages: [
      { delay: "0d", channel: "email", template: "welcome" },
      { delay: "2d", channel: "email", template: "follow-up" },
      { delay: "5d", channel: "sms", template: "reminder" },
    ],
  });

  assert.equal(flow.name, "Lead Nurture Sequence");
  assert.equal(flow.trigger.type, "event");
  assert.equal(flow.steps.length, 3);
  assert.equal(flow.steps[0]!.action, "send-email");
  assert.equal(flow.steps[2]!.action, "send-sms");
});

// ---------------------------------------------------------------------------
// Templates: Lead Scoring
// ---------------------------------------------------------------------------

test("createLeadScoringWorkflow builds a scoring flow", async () => {
  resetActivepiecesStore();
  const flow = await createLeadScoringWorkflow("t1");

  assert.equal(flow.name, "Lead Scoring Automation");
  assert.equal(flow.trigger.type, "event");
  assert.ok(flow.steps.length >= 2);
  assert.equal(flow.steps[0]!.action, "calculate-score");
  assert.equal(flow.steps[1]!.type, "condition");
});

// ---------------------------------------------------------------------------
// Templates: CRM Sync
// ---------------------------------------------------------------------------

test("createCRMSyncWorkflow builds a CRM sync flow", async () => {
  resetActivepiecesStore();
  const flow = await createCRMSyncWorkflow("t1", "salesforce");

  assert.ok(flow.name.includes("salesforce"));
  assert.equal(flow.trigger.type, "event");
  assert.equal(flow.steps.length, 2);
  assert.equal(flow.steps[0]!.action, "map-fields");
  assert.equal(flow.steps[1]!.action, "sync-to-salesforce");
});

// ---------------------------------------------------------------------------
// Templates: Email Sequence
// ---------------------------------------------------------------------------

test("createEmailSequenceWorkflow builds an email sequence flow", async () => {
  resetActivepiecesStore();
  const flow = await createEmailSequenceWorkflow("t1", {
    name: "Onboarding",
    steps: [
      { subject: "Welcome!", body: "Welcome aboard", delayDays: 0 },
      { subject: "Getting started", body: "Here are tips", delayDays: 3 },
    ],
  });

  assert.ok(flow.name.includes("Onboarding"));
  assert.equal(flow.trigger.type, "event");
  assert.equal(flow.steps.length, 2);
  assert.equal(flow.steps[0]!.action, "send-email");
});

// ---------------------------------------------------------------------------
// Templates: Webhook
// ---------------------------------------------------------------------------

test("createWebhookWorkflow builds a webhook relay flow", async () => {
  resetActivepiecesStore();
  const flow = await createWebhookWorkflow("t1", "https://hooks.example.com/inbound");

  assert.equal(flow.name, "Webhook Relay");
  assert.equal(flow.trigger.type, "webhook");
  assert.equal(flow.steps.length, 1);
  assert.equal(flow.steps[0]!.action, "forward-webhook");
  assert.equal(flow.steps[0]!.config.url, "https://hooks.example.com/inbound");
});

// ---------------------------------------------------------------------------
// getFlow throws for nonexistent ID
// ---------------------------------------------------------------------------

test("getFlow throws for nonexistent flow ID", async () => {
  resetActivepiecesStore();
  await assert.rejects(
    () => getFlow("does-not-exist"),
    /not found/,
  );
});

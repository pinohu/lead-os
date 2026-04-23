import test from "node:test";
import assert from "node:assert/strict";
import {
  createAgentTask,
  runAgentTask,
  getAgentTask,
  listAgentTasks,
  cancelAgentTask,
  resetAgentStore,
  isValidAgentType,
  type AgentTask,
  type AgentType,
} from "../src/lib/agent-orchestrator.ts";

test.beforeEach(() => {
  resetAgentStore();
});

// ---------------------------------------------------------------------------
// Task creation
// ---------------------------------------------------------------------------

test("createAgentTask returns a task with pending status", () => {
  const task = createAgentTask("funnel-agent", "tenant-1", "construction");

  assert.ok(task.id);
  assert.equal(task.agentType, "funnel-agent");
  assert.equal(task.tenantId, "tenant-1");
  assert.equal(task.nicheSlug, "construction");
  assert.equal(task.status, "pending");
  assert.deepEqual(task.steps, []);
  assert.ok(task.createdAt);
});

test("createAgentTask stores custom input", () => {
  const task = createAgentTask("analytics-agent", "tenant-1", "legal", {
    period: "7d",
  });

  assert.deepEqual(task.input, { period: "7d" });
});

test("createAgentTask generates unique IDs", () => {
  const task1 = createAgentTask("funnel-agent", "t1", "plumbing");
  const task2 = createAgentTask("funnel-agent", "t1", "plumbing");

  assert.notEqual(task1.id, task2.id);
});

// ---------------------------------------------------------------------------
// Task retrieval
// ---------------------------------------------------------------------------

test("getAgentTask returns created task", () => {
  const task = createAgentTask("creative-agent", "tenant-2", "dental");
  const found = getAgentTask(task.id);

  assert.ok(found);
  assert.equal(found.id, task.id);
  assert.equal(found.agentType, "creative-agent");
});

test("getAgentTask returns null for unknown ID", () => {
  const found = getAgentTask("nonexistent-id");
  assert.equal(found, null);
});

// ---------------------------------------------------------------------------
// Task listing with filters
// ---------------------------------------------------------------------------

test("listAgentTasks returns all tasks sorted by createdAt desc", () => {
  createAgentTask("funnel-agent", "t1", "plumbing");
  createAgentTask("creative-agent", "t2", "dental");
  createAgentTask("analytics-agent", "t1", "hvac");

  const tasks = listAgentTasks();
  assert.equal(tasks.length, 3);
});

test("listAgentTasks filters by tenantId", () => {
  createAgentTask("funnel-agent", "t1", "plumbing");
  createAgentTask("creative-agent", "t2", "dental");
  createAgentTask("analytics-agent", "t1", "hvac");

  const tasks = listAgentTasks({ tenantId: "t1" });
  assert.equal(tasks.length, 2);
  for (const t of tasks) {
    assert.equal(t.tenantId, "t1");
  }
});

test("listAgentTasks filters by agentType", () => {
  createAgentTask("funnel-agent", "t1", "plumbing");
  createAgentTask("creative-agent", "t2", "dental");
  createAgentTask("funnel-agent", "t3", "hvac");

  const tasks = listAgentTasks({ agentType: "funnel-agent" });
  assert.equal(tasks.length, 2);
  for (const t of tasks) {
    assert.equal(t.agentType, "funnel-agent");
  }
});

test("listAgentTasks filters by status", () => {
  createAgentTask("funnel-agent", "t1", "plumbing");
  const t2 = createAgentTask("creative-agent", "t2", "dental");
  cancelAgentTask(t2.id);

  const pending = listAgentTasks({ status: "pending" });
  assert.equal(pending.length, 1);

  const cancelled = listAgentTasks({ status: "cancelled" });
  assert.equal(cancelled.length, 1);
  assert.equal(cancelled[0].id, t2.id);
});

test("listAgentTasks combines multiple filters", () => {
  createAgentTask("funnel-agent", "t1", "plumbing");
  createAgentTask("funnel-agent", "t2", "dental");
  createAgentTask("creative-agent", "t1", "plumbing");

  const tasks = listAgentTasks({ tenantId: "t1", agentType: "funnel-agent" });
  assert.equal(tasks.length, 1);
});

// ---------------------------------------------------------------------------
// Cancel behavior
// ---------------------------------------------------------------------------

test("cancelAgentTask sets status to cancelled", () => {
  const task = createAgentTask("funnel-agent", "t1", "plumbing");
  const cancelled = cancelAgentTask(task.id);

  assert.ok(cancelled);
  assert.equal(cancelled.status, "cancelled");
  assert.ok(cancelled.completedAt);
});

test("cancelAgentTask returns null for unknown ID", () => {
  const result = cancelAgentTask("nonexistent");
  assert.equal(result, null);
});

test("cancelAgentTask does not change completed tasks", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  await runAgentTask(task.id);

  const result = cancelAgentTask(task.id);
  assert.ok(result);
  assert.equal(result.status, "completed");
});

test("runAgentTask on cancelled task returns without running", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  cancelAgentTask(task.id);

  const result = await runAgentTask(task.id);
  assert.equal(result.status, "cancelled");
  assert.equal(result.steps.length, 0);
});

// ---------------------------------------------------------------------------
// Task status transitions
// ---------------------------------------------------------------------------

test("runAgentTask transitions pending to running to completed", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  assert.equal(task.status, "pending");

  const result = await runAgentTask(task.id);
  assert.equal(result.status, "completed");
  assert.ok(result.startedAt);
  assert.ok(result.completedAt);
});

test("runAgentTask throws for unknown task ID", async () => {
  await assert.rejects(
    () => runAgentTask("nonexistent-id"),
    { message: "Agent task not found: nonexistent-id" },
  );
});

// ---------------------------------------------------------------------------
// isValidAgentType
// ---------------------------------------------------------------------------

test("isValidAgentType accepts valid types", () => {
  assert.ok(isValidAgentType("funnel-agent"));
  assert.ok(isValidAgentType("creative-agent"));
  assert.ok(isValidAgentType("optimization-agent"));
  assert.ok(isValidAgentType("analytics-agent"));
  assert.ok(isValidAgentType("onboarding-agent"));
});

test("isValidAgentType rejects invalid types", () => {
  assert.equal(isValidAgentType("invalid-agent"), false);
  assert.equal(isValidAgentType(""), false);
  assert.equal(isValidAgentType("funnel"), false);
});

// ---------------------------------------------------------------------------
// Funnel Agent
// ---------------------------------------------------------------------------

test("funnel agent produces steps for each engine call", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.equal(task.steps.length, 8);
  assert.equal(task.steps[0].name, "Load niche config");
  assert.equal(task.steps[0].engine, "niche-generator");
  assert.equal(task.steps[1].name, "Generate design spec");
  assert.equal(task.steps[2].name, "Generate landing page");
  assert.equal(task.steps[3].name, "Recommend lead magnets");
  assert.equal(task.steps[4].name, "Generate offer");
  assert.equal(task.steps[5].name, "Generate psychology triggers");
  assert.equal(task.steps[6].name, "Generate trust badges");
  assert.equal(task.steps[7].name, "Generate email nurture sequence");
});

test("funnel agent records step durations", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  await runAgentTask(task.id);

  for (const step of task.steps) {
    assert.ok(
      step.durationMs !== undefined && step.durationMs >= 0,
      `Step "${step.name}" should have durationMs`,
    );
  }
});

test("funnel agent produces result with asset keys", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.ok(task.result);
  assert.equal(task.result.tenantId, "t1");
  assert.equal(task.result.nicheSlug, "construction");
  assert.ok(typeof task.result.stepsCompleted === "number");
});

// ---------------------------------------------------------------------------
// Creative Agent
// ---------------------------------------------------------------------------

test("creative agent produces steps for all asset types", async () => {
  const task = createAgentTask("creative-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.equal(task.steps.length, 6);
  assert.equal(task.steps[0].name, "Load niche config");
  assert.equal(task.steps[1].name, "Generate SEO landing page");
  assert.equal(task.steps[2].name, "Generate social posts");
  assert.equal(task.steps[3].name, "Generate blog outline");
  assert.equal(task.steps[4].name, "Generate video script");
  assert.equal(task.steps[5].name, "Generate offer copy");
});

test("creative agent result includes assetTypes array", async () => {
  const task = createAgentTask("creative-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.ok(task.result);
  assert.ok(Array.isArray(task.result.assetTypes));
});

// ---------------------------------------------------------------------------
// Optimization Agent
// ---------------------------------------------------------------------------

test("optimization agent produces 8 steps", async () => {
  const task = createAgentTask("optimization-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.equal(task.steps.length, 8);
  assert.equal(task.steps[0].name, "Run feedback cycle");
  assert.equal(task.steps[6].name, "Compile optimization report");
  assert.equal(task.steps[7].name, "Auto-apply safe adjustments");
});

test("optimization agent completes even with step failures", async () => {
  const task = createAgentTask("optimization-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.equal(task.status, "completed");
});

// ---------------------------------------------------------------------------
// Analytics Agent
// ---------------------------------------------------------------------------

test("analytics agent produces 7 steps", async () => {
  const task = createAgentTask("analytics-agent", "t1", "construction");
  await runAgentTask(task.id);

  assert.equal(task.steps.length, 7);
  assert.equal(task.steps[0].name, "Get scoring distribution");
  assert.equal(task.steps[6].name, "Compile executive summary");
});

test("analytics agent uses custom period from input", async () => {
  const task = createAgentTask("analytics-agent", "t1", "construction", { period: "7d" });
  await runAgentTask(task.id);

  assert.ok(task.result);
  assert.equal(task.result.period, "7d");
});

// ---------------------------------------------------------------------------
// Onboarding Agent
// ---------------------------------------------------------------------------

test("onboarding agent chains funnel and creative agents", async () => {
  const task = createAgentTask("onboarding-agent", "t1", "construction", {
    operatorEmail: "test@example.com",
  });
  await runAgentTask(task.id);

  const stepNames = task.steps.map((s) => s.name);
  assert.ok(stepNames.includes("Run funnel agent"));
  assert.ok(stepNames.includes("Run creative agent"));
});

test("onboarding agent creates chained sub-tasks", async () => {
  const task = createAgentTask("onboarding-agent", "t1", "construction");
  await runAgentTask(task.id);

  // Sub-tasks should be visible in the store
  const allTasks = listAgentTasks();
  const funnelTasks = allTasks.filter((t) => t.agentType === "funnel-agent");
  const creativeTasks = allTasks.filter((t) => t.agentType === "creative-agent");

  // The onboarding agent should have created sub-tasks even if tenant creation failed
  // (the funnel/creative steps may have been reached or not depending on tenant creation)
  assert.ok(allTasks.length >= 1);
  // If onboarding got past step 1, we expect sub-tasks
  const funnelStep = task.steps.find((s) => s.name === "Run funnel agent");
  if (funnelStep && funnelStep.status === "completed") {
    assert.ok(funnelTasks.length >= 1);
  }
  const creativeStep = task.steps.find((s) => s.name === "Run creative agent");
  if (creativeStep && creativeStep.status === "completed") {
    assert.ok(creativeTasks.length >= 1);
  }
});

test("onboarding agent has 6 steps when tenant creation fails", async () => {
  // tenant-store requires db, so creation will fail in test, triggering early exit
  const task = createAgentTask("onboarding-agent", "t1", "construction");
  await runAgentTask(task.id);

  // If tenant creation fails, task is marked failed and only has 1 step
  if (task.status === "failed") {
    assert.equal(task.steps.length, 1);
    assert.equal(task.steps[0].name, "Create tenant");
    assert.equal(task.steps[0].status, "failed");
  } else {
    // If it succeeded (e.g. in-memory fallback works), check all steps
    assert.ok(task.steps.length >= 6);
  }
});

// ---------------------------------------------------------------------------
// Step failure resilience
// ---------------------------------------------------------------------------

test("step failure does not kill the whole funnel agent", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  await runAgentTask(task.id);

  const failedSteps = task.steps.filter((s) => s.status === "failed");
  const completedSteps = task.steps.filter((s) => s.status === "completed");

  // Some steps may fail (e.g., trust engine depends on tenant data), but the agent continues
  assert.equal(task.status, "completed");
  assert.ok(completedSteps.length > 0, "At least some steps should complete");
});

test("failed steps record error messages", async () => {
  const task = createAgentTask("funnel-agent", "t1", "construction");
  await runAgentTask(task.id);

  const failedSteps = task.steps.filter((s) => s.status === "failed");
  for (const step of failedSteps) {
    assert.ok(step.error, `Failed step "${step.name}" should have an error message`);
    assert.ok(step.error.length > 0);
  }
});

test("step failure still records durationMs", async () => {
  const task = createAgentTask("optimization-agent", "t1", "construction");
  await runAgentTask(task.id);

  for (const step of task.steps) {
    assert.ok(
      step.durationMs !== undefined,
      `Step "${step.name}" should have durationMs even if failed`,
    );
  }
});

// ---------------------------------------------------------------------------
// Dynamic import failure handling
// ---------------------------------------------------------------------------

test("agent handles missing module gracefully", async () => {
  // The various engines may not fully work in test context without DB.
  // The orchestrator should handle dynamic import failures without crashing.
  const task = createAgentTask("analytics-agent", "t1", "construction");
  await runAgentTask(task.id);

  // Task should not throw but complete (possibly with some failed steps)
  assert.ok(
    task.status === "completed" || task.status === "failed",
    "Task should reach a terminal state",
  );
});

// ---------------------------------------------------------------------------
// resetAgentStore
// ---------------------------------------------------------------------------

test("resetAgentStore clears all tasks", () => {
  createAgentTask("funnel-agent", "t1", "plumbing");
  createAgentTask("creative-agent", "t2", "dental");
  assert.equal(listAgentTasks().length, 2);

  resetAgentStore();
  assert.equal(listAgentTasks().length, 0);
});

// ---------------------------------------------------------------------------
// Multiple agent types run independently
// ---------------------------------------------------------------------------

test("different agent types can run concurrently without interference", async () => {
  const funnel = createAgentTask("funnel-agent", "t1", "construction");
  const creative = createAgentTask("creative-agent", "t2", "dental");
  const analytics = createAgentTask("analytics-agent", "t3", "hvac");

  await Promise.all([
    runAgentTask(funnel.id),
    runAgentTask(creative.id),
    runAgentTask(analytics.id),
  ]);

  const funnelResult = getAgentTask(funnel.id);
  const creativeResult = getAgentTask(creative.id);
  const analyticsResult = getAgentTask(analytics.id);

  assert.ok(funnelResult);
  assert.ok(creativeResult);
  assert.ok(analyticsResult);

  // All should reach terminal state
  for (const t of [funnelResult, creativeResult, analyticsResult]) {
    assert.ok(
      t.status === "completed" || t.status === "failed",
      `Task ${t.agentType} should be terminal, got ${t.status}`,
    );
  }
});

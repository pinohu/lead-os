import test from "node:test";
import assert from "node:assert/strict";
import {
  scheduleRecurringTask,
  listScheduledTasks,
  pauseScheduledTask,
  resumeScheduledTask,
  deleteScheduledTask,
  getScheduledTask,
  evaluateSchedules,
  resetSchedulerStore,
} from "../src/lib/agent-scheduler.ts";
import {
  createAgentTeam,
  addAgent,
  resetPaperclipStores,
} from "../src/lib/paperclip-orchestrator.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupTeamWithAgent() {
  const tenantId = `tenant-${Date.now()}`;
  const team = await createAgentTeam(tenantId, {
    name: "Scheduler Test Team",
    description: "test",
    tenantId,
    maxBudgetPerDay: 100,
    maxConcurrentTasks: 5,
  });
  const agent = await addAgent(team.id, {
    name: "Test Agent",
    role: "prospector",
    tools: ["firecrawl"],
    model: "gpt-4o",
    systemPrompt: "Test",
    maxTokensPerTask: 4000,
    budgetPerDay: 10,
  });
  return { tenantId, team, agent };
}

// ---------------------------------------------------------------------------
// Schedule creation
// ---------------------------------------------------------------------------

test("scheduleRecurringTask creates an active scheduled task", async () => {
  resetPaperclipStores();
  resetSchedulerStore();
  const { agent } = await setupTeamWithAgent();

  const scheduled = await scheduleRecurringTask(agent.id, {
    cronExpression: "0 9 * * *",
    task: { type: "daily-prospect", input: {}, priority: "normal" },
    timezone: "America/New_York",
  });

  assert.ok(scheduled.id);
  assert.equal(scheduled.agentId, agent.id);
  assert.equal(scheduled.status, "active");
  assert.equal(scheduled.totalRuns, 0);
  assert.equal(scheduled.successRate, 100);
  assert.ok(scheduled.nextRunAt);
  assert.equal(scheduled.lastRunAt, null);
});

test("listScheduledTasks returns tasks for a team", async () => {
  resetPaperclipStores();
  resetSchedulerStore();
  const { team, agent } = await setupTeamWithAgent();

  await scheduleRecurringTask(agent.id, {
    cronExpression: "0 * * * *",
    task: { type: "hourly-check", input: {}, priority: "low" },
  });
  await scheduleRecurringTask(agent.id, {
    cronExpression: "0 0 * * *",
    task: { type: "daily-report", input: {}, priority: "normal" },
  });

  const tasks = await listScheduledTasks(team.id);
  assert.equal(tasks.length, 2);
});

// ---------------------------------------------------------------------------
// Pause / Resume / Delete
// ---------------------------------------------------------------------------

test("pauseScheduledTask and resumeScheduledTask toggle status", async () => {
  resetPaperclipStores();
  resetSchedulerStore();
  const { agent } = await setupTeamWithAgent();

  const scheduled = await scheduleRecurringTask(agent.id, {
    cronExpression: "*/5 * * * *",
    task: { type: "check", input: {}, priority: "normal" },
  });

  await pauseScheduledTask(scheduled.id);
  let fetched = await getScheduledTask(scheduled.id);
  assert.equal(fetched?.status, "paused");

  await resumeScheduledTask(scheduled.id);
  fetched = await getScheduledTask(scheduled.id);
  assert.equal(fetched?.status, "active");
});

test("deleteScheduledTask removes the task", async () => {
  resetPaperclipStores();
  resetSchedulerStore();
  const { agent } = await setupTeamWithAgent();

  const scheduled = await scheduleRecurringTask(agent.id, {
    cronExpression: "0 0 * * *",
    task: { type: "nightly-cleanup", input: {}, priority: "low" },
  });

  await deleteScheduledTask(scheduled.id);
  const fetched = await getScheduledTask(scheduled.id);
  assert.equal(fetched, null);
});

// ---------------------------------------------------------------------------
// Schedule evaluation
// ---------------------------------------------------------------------------

test("evaluateSchedules identifies due tasks", async () => {
  resetPaperclipStores();
  resetSchedulerStore();
  const { agent } = await setupTeamWithAgent();

  const scheduled = await scheduleRecurringTask(agent.id, {
    cronExpression: "* * * * *",
    task: { type: "every-minute", input: {}, priority: "normal" },
  });

  // Set nextRunAt to the past so it's due
  const task = await getScheduledTask(scheduled.id);
  if (task) {
    (task as { nextRunAt: string }).nextRunAt = new Date(
      Date.now() - 120_000,
    ).toISOString();
  }

  const evaluations = await evaluateSchedules();
  const found = evaluations.find((e) => e.taskId === scheduled.id);
  assert.ok(found);
  assert.equal(found.shouldRun, true);
  assert.equal(found.reason, "Schedule is due");
});

test("evaluateSchedules skips paused tasks", async () => {
  resetPaperclipStores();
  resetSchedulerStore();
  const { agent } = await setupTeamWithAgent();

  const scheduled = await scheduleRecurringTask(agent.id, {
    cronExpression: "* * * * *",
    task: { type: "every-minute", input: {}, priority: "normal" },
  });

  await pauseScheduledTask(scheduled.id);

  const evaluations = await evaluateSchedules();
  const found = evaluations.find((e) => e.taskId === scheduled.id);
  assert.ok(found);
  assert.equal(found.shouldRun, false);
  assert.equal(found.reason, "Task is paused");
});

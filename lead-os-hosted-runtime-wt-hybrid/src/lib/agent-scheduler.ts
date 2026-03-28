// ---------------------------------------------------------------------------
// Agent Scheduler — autonomous task scheduling with cron expressions.
// Evaluates which scheduled tasks should run and manages their lifecycle.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import type { AgentTask } from "./paperclip-orchestrator.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleConfig {
  cronExpression: string;
  task: AgentTask;
  timezone?: string;
  maxMissedRuns?: number;
}

export interface ScheduledTask {
  id: string;
  agentId: string;
  schedule: ScheduleConfig;
  status: "active" | "paused";
  lastRunAt: string | null;
  nextRunAt: string;
  totalRuns: number;
  successRate: number;
}

export interface ScheduleEvaluation {
  taskId: string;
  shouldRun: boolean;
  reason: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const scheduledTaskStore = new Map<string, ScheduledTask>();

// ---------------------------------------------------------------------------
// Cron helpers — minimal parser for common expressions
// ---------------------------------------------------------------------------

const CRON_INTERVALS: Record<string, number> = {
  "* * * * *": 60_000,
  "*/5 * * * *": 5 * 60_000,
  "*/15 * * * *": 15 * 60_000,
  "*/30 * * * *": 30 * 60_000,
  "0 * * * *": 60 * 60_000,
  "0 */2 * * *": 2 * 60 * 60_000,
  "0 */6 * * *": 6 * 60 * 60_000,
  "0 */12 * * *": 12 * 60 * 60_000,
  "0 0 * * *": 24 * 60 * 60_000,
  "0 9 * * *": 24 * 60 * 60_000,
  "0 0 * * 1": 7 * 24 * 60 * 60_000,
  "0 9 * * 1": 7 * 24 * 60 * 60_000,
};

function getIntervalMs(cronExpression: string): number {
  return CRON_INTERVALS[cronExpression] ?? 60 * 60_000;
}

function computeNextRun(cronExpression: string, fromDate?: Date): string {
  const from = fromDate ?? new Date();
  const intervalMs = getIntervalMs(cronExpression);
  const next = new Date(from.getTime() + intervalMs);
  return next.toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function scheduleRecurringTask(
  agentId: string,
  schedule: ScheduleConfig,
): Promise<ScheduledTask> {
  const task: ScheduledTask = {
    id: randomUUID(),
    agentId,
    schedule,
    status: "active",
    lastRunAt: null,
    nextRunAt: computeNextRun(schedule.cronExpression),
    totalRuns: 0,
    successRate: 100,
  };
  scheduledTaskStore.set(task.id, task);
  return task;
}

export async function listScheduledTasks(
  teamId: string,
): Promise<ScheduledTask[]> {
  // Since scheduled tasks are keyed by agentId, we need the orchestrator
  // to resolve team membership. For simplicity in the in-memory store,
  // we accept teamId and filter by checking all tasks.
  // In production this would be a JOIN query.
  const agentIds = new Set<string>();

  try {
    const { getAgentTeam } = await import("./paperclip-orchestrator.ts");
    const team = await getAgentTeam(teamId);
    for (const agent of team.agents) {
      agentIds.add(agent.id);
    }
  } catch {
    // Team not found — return empty
    return [];
  }

  return Array.from(scheduledTaskStore.values())
    .filter((t) => agentIds.has(t.agentId))
    .sort(
      (a, b) =>
        new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime(),
    );
}

export async function pauseScheduledTask(taskId: string): Promise<void> {
  const task = scheduledTaskStore.get(taskId);
  if (!task) {
    throw new Error(`Scheduled task not found: ${taskId}`);
  }
  task.status = "paused";
}

export async function resumeScheduledTask(taskId: string): Promise<void> {
  const task = scheduledTaskStore.get(taskId);
  if (!task) {
    throw new Error(`Scheduled task not found: ${taskId}`);
  }
  task.status = "active";
  task.nextRunAt = computeNextRun(task.schedule.cronExpression);
}

export async function deleteScheduledTask(taskId: string): Promise<void> {
  const task = scheduledTaskStore.get(taskId);
  if (!task) {
    throw new Error(`Scheduled task not found: ${taskId}`);
  }
  scheduledTaskStore.delete(taskId);
}

export async function getScheduledTask(
  taskId: string,
): Promise<ScheduledTask | null> {
  return scheduledTaskStore.get(taskId) ?? null;
}

export async function evaluateSchedules(): Promise<ScheduleEvaluation[]> {
  const now = new Date();
  const evaluations: ScheduleEvaluation[] = [];

  for (const task of scheduledTaskStore.values()) {
    if (task.status === "paused") {
      evaluations.push({
        taskId: task.id,
        shouldRun: false,
        reason: "Task is paused",
      });
      continue;
    }

    const nextRunTime = new Date(task.nextRunAt).getTime();
    if (now.getTime() >= nextRunTime) {
      const maxMissed = task.schedule.maxMissedRuns ?? 3;
      const intervalMs = getIntervalMs(task.schedule.cronExpression);
      const missedRuns = Math.floor(
        (now.getTime() - nextRunTime) / intervalMs,
      );

      if (missedRuns > maxMissed) {
        evaluations.push({
          taskId: task.id,
          shouldRun: false,
          reason: `Exceeded max missed runs (${missedRuns} > ${maxMissed})`,
        });
        continue;
      }

      evaluations.push({
        taskId: task.id,
        shouldRun: true,
        reason: "Schedule is due",
      });

      task.lastRunAt = now.toISOString();
      task.totalRuns += 1;
      task.nextRunAt = computeNextRun(task.schedule.cronExpression, now);
    } else {
      evaluations.push({
        taskId: task.id,
        shouldRun: false,
        reason: `Next run at ${task.nextRunAt}`,
      });
    }
  }

  return evaluations;
}

// ---------------------------------------------------------------------------
// Store reset (testing only)
// ---------------------------------------------------------------------------

export function resetSchedulerStore(): void {
  scheduledTaskStore.clear();
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  addJob,
  addBulkJobs,
  getJob,
  getQueueStats,
  registerWorker,
  removeWorker,
  scheduleRecurringJobs,
  getScheduledJobs,
  resetJobQueue,
  type JobDefinition,
} from "../src/lib/integrations/job-queue.ts";

// Ensure Redis is not used during tests
delete process.env.REDIS_URL;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("addJob returns a string job ID", async () => {
  resetJobQueue();
  const id = await addJob("test-queue", { name: "test-job", data: { foo: "bar" } });
  assert.equal(typeof id, "string");
  assert.ok(id.length > 0);
});

test("addJob with delay does not process immediately", async () => {
  resetJobQueue();
  const processed: string[] = [];
  registerWorker("delayed-queue", async (job) => {
    processed.push(job.name);
  });

  await addJob("delayed-queue", { name: "slow-job", data: {}, options: { delay: 200 } });
  assert.equal(processed.length, 0, "Job should not be processed before delay");
});

test("addJob processes job after delay via worker", async () => {
  resetJobQueue();
  const processed: string[] = [];
  registerWorker("proc-queue", async (job) => {
    processed.push(job.name);
  });

  await addJob("proc-queue", { name: "fast-job", data: {} });
  await delay(50);
  assert.equal(processed.length, 1);
  assert.equal(processed[0], "fast-job");
});

test("getJob returns job status after adding", async () => {
  resetJobQueue();
  const id = await addJob("status-queue", { name: "status-job", data: { x: 1 } });
  const job = await getJob("status-queue", id);
  assert.ok(job, "Job should be found");
  assert.equal(job.id, id);
  assert.equal(job.name, "status-job");
  assert.ok(["waiting", "active", "completed"].includes(job.status));
});

test("getJob returns undefined for unknown job ID", async () => {
  resetJobQueue();
  const job = await getJob("empty-queue", "nonexistent-id");
  assert.equal(job, undefined);
});

test("getQueueStats returns correct counts", async () => {
  resetJobQueue();
  const stats = await getQueueStats("stats-queue");
  assert.equal(stats.waiting, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.completed, 0);
  assert.equal(stats.failed, 0);
});

test("getQueueStats counts waiting jobs", async () => {
  resetJobQueue();
  await addJob("count-queue", { name: "job-1", data: {}, options: { delay: 5000 } });
  await addJob("count-queue", { name: "job-2", data: {}, options: { delay: 5000 } });

  const stats = await getQueueStats("count-queue");
  assert.equal(stats.waiting, 2);
});

test("addBulkJobs returns array of job IDs", async () => {
  resetJobQueue();
  const jobs: JobDefinition[] = [
    { name: "bulk-1", data: { n: 1 } },
    { name: "bulk-2", data: { n: 2 } },
    { name: "bulk-3", data: { n: 3 } },
  ];

  const ids = await addBulkJobs("bulk-queue", jobs);
  assert.equal(ids.length, 3);
  for (const id of ids) {
    assert.equal(typeof id, "string");
    assert.ok(id.length > 0);
  }
});

test("addBulkJobs returns unique IDs", async () => {
  resetJobQueue();
  const jobs: JobDefinition[] = Array.from({ length: 5 }, (_, i) => ({
    name: `unique-job-${i}`,
    data: { i },
  }));

  const ids = await addBulkJobs("unique-queue", jobs);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

test("registerWorker processes completed job correctly", async () => {
  resetJobQueue();
  let processedData: Record<string, unknown> | null = null;

  registerWorker("worker-queue", async (job) => {
    processedData = job.data;
  });

  await addJob("worker-queue", { name: "worker-job", data: { value: 42 } });
  await delay(50);

  assert.ok(processedData !== null, "Worker should have processed the job");
  assert.equal((processedData as Record<string, unknown>).value, 42);
});

test("removeWorker stops worker from processing", async () => {
  resetJobQueue();
  const processed: string[] = [];
  registerWorker("removable-queue", async (job) => {
    processed.push(job.name);
  });
  removeWorker("removable-queue");

  await addJob("removable-queue", { name: "orphan-job", data: {}, options: { delay: 5000 } });
  await delay(50);

  assert.equal(processed.length, 0, "Worker removed before processing");
});

test("failed job status when no worker registered", async () => {
  resetJobQueue();
  const id = await addJob("no-worker-queue", { name: "no-worker-job", data: {} });
  await delay(50);

  const job = await getJob("no-worker-queue", id);
  assert.ok(job);
  assert.equal(job.status, "failed");
  assert.ok(job.failedReason?.includes("No worker"));
});

test("scheduleRecurringJobs populates scheduled jobs list", () => {
  resetJobQueue();
  scheduleRecurringJobs();
  const jobs = getScheduledJobs();
  assert.ok(jobs.length > 0, "Should have scheduled jobs");
});

test("getScheduledJobs returns jobs with required fields", () => {
  resetJobQueue();
  scheduleRecurringJobs();
  const jobs = getScheduledJobs();

  for (const job of jobs) {
    assert.equal(typeof job.name, "string");
    assert.equal(typeof job.cron, "string");
    assert.equal(typeof job.nextRun, "string");
    assert.ok(job.cron.split(" ").length === 5, "Cron should have 5 parts");
  }
});

test("getScheduledJobs returns all OPTIMIZATION_CRONS", async () => {
  resetJobQueue();
  const { OPTIMIZATION_CRONS } = await import("../src/lib/optimization-crons.ts");
  scheduleRecurringJobs();
  const jobs = getScheduledJobs();
  assert.equal(jobs.length, OPTIMIZATION_CRONS.length);
});

test("resetJobQueue clears all queues and workers", async () => {
  resetJobQueue();
  await addJob("reset-test", { name: "to-be-cleared", data: {} });
  registerWorker("reset-test", async () => {});

  resetJobQueue();

  const stats = await getQueueStats("reset-test");
  assert.equal(stats.waiting, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.completed, 0);
  assert.equal(stats.failed, 0);
});

test("nextRun is a valid ISO 8601 timestamp", () => {
  resetJobQueue();
  scheduleRecurringJobs();
  const jobs = getScheduledJobs();
  for (const job of jobs) {
    const date = new Date(job.nextRun);
    assert.ok(!isNaN(date.getTime()), `nextRun "${job.nextRun}" should be a valid date`);
  }
});

test("multiple queues are isolated from each other", async () => {
  resetJobQueue();
  await addJob("queue-a", { name: "job-a", data: {}, options: { delay: 5000 } });
  await addJob("queue-a", { name: "job-a2", data: {}, options: { delay: 5000 } });
  await addJob("queue-b", { name: "job-b", data: {}, options: { delay: 5000 } });

  const statsA = await getQueueStats("queue-a");
  const statsB = await getQueueStats("queue-b");

  assert.equal(statsA.waiting, 2);
  assert.equal(statsB.waiting, 1);
});

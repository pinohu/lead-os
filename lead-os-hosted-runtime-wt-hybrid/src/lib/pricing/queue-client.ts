// src/lib/pricing/queue-client.ts
// BullMQ queues + Redis connection (no job handlers — avoids circular imports).

import type { PricingDlqJobData, PricingMeasureJobData, PricingTickJobData } from "./types.ts";
import { getDefaultTenantId, getPricingTickIntervalMs, isRedisUrlConfigured } from "./env.ts";

export const PRICING_QUEUE_MAIN = "leados-pricing-main";
export const PRICING_QUEUE_MEASURE = "leados-pricing-measure";
export const PRICING_QUEUE_DLQ = "leados-pricing-dlq";

let sharedIoRedis: import("ioredis").default | null = null;
let mainQueue: import("bullmq").Queue | null = null;
let measureQueue: import("bullmq").Queue | null = null;
let dlqQueue: import("bullmq").Queue | null = null;

const defaultJobOpts = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 4000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 500 },
};

export async function getSharedIoRedis(): Promise<import("ioredis").default> {
  if (!isRedisUrlConfigured()) throw new Error("REDIS_URL is not configured");
  if (sharedIoRedis) return sharedIoRedis;
  const { default: IORedis } = await import("ioredis");
  sharedIoRedis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
  return sharedIoRedis;
}

export async function getMainQueue(): Promise<import("bullmq").Queue> {
  if (mainQueue) return mainQueue;
  const { Queue } = await import("bullmq");
  const connection = await getSharedIoRedis();
  mainQueue = new Queue(PRICING_QUEUE_MAIN, { connection, defaultJobOptions: defaultJobOpts });
  return mainQueue;
}

export async function getMeasureQueue(): Promise<import("bullmq").Queue> {
  if (measureQueue) return measureQueue;
  const { Queue } = await import("bullmq");
  const connection = await getSharedIoRedis();
  measureQueue = new Queue(PRICING_QUEUE_MEASURE, { connection, defaultJobOptions: defaultJobOpts });
  return measureQueue;
}

export async function getDlqQueue(): Promise<import("bullmq").Queue> {
  if (dlqQueue) return dlqQueue;
  const { Queue } = await import("bullmq");
  const connection = await getSharedIoRedis();
  dlqQueue = new Queue(PRICING_QUEUE_DLQ, { connection, defaultJobOptions: { removeOnComplete: { count: 5000 } } });
  return dlqQueue;
}

export async function enqueuePricingTickRequest(
  tenantId?: string,
  source = "http",
): Promise<string | undefined> {
  if (!isRedisUrlConfigured()) return undefined;
  const q = await getMainQueue();
  const job = await q.add(
    "tick",
    { kind: "tick", tenantId: tenantId ?? getDefaultTenantId(), source } satisfies PricingTickJobData,
    {},
  );
  return job.id;
}

export async function enqueueMeasureJob(
  data: PricingMeasureJobData,
  opts: { delayMs: number; jobId: string },
): Promise<void> {
  if (!isRedisUrlConfigured()) return;
  const q = await getMeasureQueue();
  await q.add("measure", data, { delay: opts.delayMs, jobId: opts.jobId });
}

export async function pushToDlq(payload: PricingDlqJobData): Promise<void> {
  const { insertDeadLetterJob } = await import("./repository.ts");
  await insertDeadLetterJob({
    sourceQueue: payload.sourceQueue,
    jobName: payload.originalName,
    jobId: payload.failedJobId,
    payload: {
      ...payload.originalData,
      _dlq: {
        errorMessage: payload.errorMessage,
        sourceQueue: payload.sourceQueue,
        jobName: payload.originalName,
      },
    },
    errorMessage: payload.errorMessage,
    attempts: payload.attemptsMade ?? 5,
  });
  if (!isRedisUrlConfigured()) return;
  const q = await getDlqQueue();
  await q.add("dead", payload, {});
}

export async function getPricingQueueStats(): Promise<{
  main: Record<string, number>;
  measure: Record<string, number>;
  dlq: Record<string, number>;
}> {
  if (!isRedisUrlConfigured()) {
    return {
      main: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      measure: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      dlq: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
    };
  }
  const [mq, yq, dq] = await Promise.all([getMainQueue(), getMeasureQueue(), getDlqQueue()]);
  const counts = async (q: import("bullmq").Queue) => {
    const [waiting, active, completed, failed, delayedJobs] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayed(),
    ]);
    return {
      waiting,
      active,
      completed,
      failed,
      delayed: delayedJobs.length,
    };
  };
  const [main, measure, dlq] = await Promise.all([counts(mq), counts(yq), counts(dq)]);
  return { main, measure, dlq };
}

export async function tryDistributedSchedulerEnqueue(): Promise<boolean> {
  if (!isRedisUrlConfigured()) return false;
  const { default: IORedis } = await import("ioredis");
  const tickMs = getPricingTickIntervalMs();
  const lockTtl = Math.max(30, Math.floor(tickMs * 0.75));
  const r = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: 1 });
  try {
    const locked = await r.set("leados:pricing:sched-lock", "1", "EX", lockTtl, "NX");
    if (locked !== "OK") return false;
    await enqueuePricingTickRequest(undefined, "scheduler");
    return true;
  } finally {
    await r.quit().catch(() => {});
  }
}

function stripDlqPayload(p: Record<string, unknown>): Record<string, unknown> {
  if ("_dlq" in p && p._dlq) {
    const { _dlq: _ignored, ...rest } = p;
    return rest;
  }
  return p;
}

export async function replayDeadLetterJobById(deadLetterId: string): Promise<void> {
  if (!isRedisUrlConfigured()) throw new Error("REDIS_URL is not configured; cannot replay queue job");
  const { getDeadLetterJobById } = await import("./repository.ts");
  const row = await getDeadLetterJobById(deadLetterId);
  if (!row) throw new Error("dead_letter job not found");
  const payload = stripDlqPayload(row.payload);

  if (row.jobName === "tick" && payload.kind === "tick") {
    const q = await getMainQueue();
    await q.add("tick", payload as PricingTickJobData, {});
    return;
  }
  if (row.jobName === "measure" && payload.kind === "measure") {
    const q = await getMeasureQueue();
    await q.add("measure", payload as PricingMeasureJobData, {
      jobId: `replay-dlq-${deadLetterId}-${Date.now()}`,
    });
    return;
  }

  throw new Error(`unsupported dead letter replay: job_name=${row.jobName} kind=${String(payload.kind)}`);
}

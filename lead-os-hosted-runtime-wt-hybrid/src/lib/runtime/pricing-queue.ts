import { Queue } from "bullmq";

type PricingJobPayload = {
  recommendationId?: string;
  nodeId?: string;
  reason?: string;
  requestedAt?: string;
};

const queueName = "pricing-autopilot";
let queueInstance: Queue<PricingJobPayload> | null = null;

function hasRedis() {
  return Boolean(process.env.REDIS_URL);
}

export function getPricingQueueMode() {
  return hasRedis() ? "bullmq" : "in-memory";
}

export function getPricingQueue() {
  if (!hasRedis()) return null;
  if (queueInstance) return queueInstance;

  queueInstance = new Queue<PricingJobPayload>(queueName, {
    connection: {
      url: process.env.REDIS_URL,
    } as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  return queueInstance;
}

const memoryJobs: PricingJobPayload[] = [];

export async function enqueuePricingJob(payload: PricingJobPayload) {
  const enriched = {
    ...payload,
    requestedAt: payload.requestedAt ?? new Date().toISOString(),
  };

  const queue = getPricingQueue();
  if (!queue) {
    memoryJobs.push(enriched);
    return {
      ok: true,
      mode: "in-memory",
      queued: enriched,
      depth: memoryJobs.length,
    };
  }

  const job = await queue.add("pricing-evaluate", enriched);
  return {
    ok: true,
    mode: "bullmq",
    jobId: job.id,
    queued: enriched,
  };
}

export function getInMemoryPricingJobs() {
  return [...memoryJobs];
}

export function drainInMemoryPricingJobs() {
  const jobs = [...memoryJobs];
  memoryJobs.length = 0;
  return jobs;
}

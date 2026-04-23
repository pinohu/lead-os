// src/lib/pricing/bootstrap.ts
// Registers BullMQ workers, DLQ forwarding, and optional distributed scheduler tick.

import {
  getPricingTickIntervalMs,
  isPricingWorkerDisabled,
  isRedisUrlConfigured,
  isSystemEnabled,
} from "./env.ts";
import {
  PRICING_QUEUE_MAIN,
  PRICING_QUEUE_MEASURE,
  pushToDlq,
  tryRunAutonomyAgentsByScheduler,
  tryDistributedSchedulerEnqueue,
} from "./queue-client.ts";
import {
  markDlq,
  markSchedulerStarted,
  markWorkersStarted,
} from "./runtime-state.ts";
import { pricingLog } from "./logger.ts";

const globalForWorkers = globalThis as typeof globalThis & {
  __leadOsPricingRuntimeStarted?: boolean;
  __leadOsPricingScheduler?: ReturnType<typeof setInterval> | undefined;
};

async function attachFailedToDlq(
  queueLabel: typeof PRICING_QUEUE_MAIN | typeof PRICING_QUEUE_MEASURE,
  job: { id?: string; name: string; data: unknown; attemptsMade?: number; opts?: { attempts?: number } } | undefined,
  err: Error,
): Promise<void> {
  if (!job) return;
  const maxAttempts = job.opts?.attempts ?? 5;
  if ((job.attemptsMade ?? 0) < maxAttempts) return;
  await pushToDlq({
    kind: "dlq",
    sourceQueue: queueLabel,
    originalName: job.name,
    originalData: job.data as Record<string, unknown>,
    errorMessage: err.message,
    failedJobId: job.id,
    attemptsMade: job.attemptsMade,
  });
  markDlq();
}

export async function startPricingWorkerOnly(): Promise<void> {
  await startPricingWorkersInternal({
    mode: "worker",
    enableScheduler: false,
    allowMemoryFallback: false,
  });
}

/**
 * Next.js web process: never starts BullMQ workers when Redis is configured —
 * use `npm run worker` so workers and the distributed scheduler run in isolation.
 */
export async function startPricingRuntimeWeb(): Promise<void> {
  const enableScheduler = process.env.LEAD_OS_PRICING_ENABLE_SCHEDULER !== "false";
  const allowMemory =
    process.env.VERCEL !== "1" &&
    process.env.NODE_ENV !== "production" &&
    !isRedisUrlConfigured();
  await startPricingWorkersInternal({
    mode: "web",
    enableScheduler,
    allowMemoryFallback: allowMemory,
  });
}

/** @deprecated Prefer startPricingRuntimeWeb or startPricingRuntimeWorker */
export async function startPricingRuntime(): Promise<void> {
  await startPricingRuntimeWeb();
}

/**
 * Dedicated worker process: BullMQ consumers + optional in-process scheduler tick.
 */
export async function startPricingRuntimeWorker(): Promise<void> {
  const allowMemory =
    process.env.LEAD_OS_WORKER_ALLOW_MEMORY === "true" && process.env.NODE_ENV !== "production";
  await startPricingWorkersInternal({
    mode: "worker",
    enableScheduler: process.env.LEAD_OS_PRICING_ENABLE_SCHEDULER !== "false",
    allowMemoryFallback: allowMemory,
  });
}

async function startPricingWorkersInternal(opts: {
  mode: "web" | "worker";
  enableScheduler: boolean;
  allowMemoryFallback: boolean;
}): Promise<void> {
  if (!isSystemEnabled()) {
    pricingLog("warn", "pricing_runtime_disabled", { reason: "SYSTEM_ENABLED=false" });
    return;
  }
  if (globalForWorkers.__leadOsPricingRuntimeStarted) return;

  if (isRedisUrlConfigured() && !isPricingWorkerDisabled()) {
    if (opts.mode === "web") {
      pricingLog("info", "pricing_web_skips_bullmq", {
        message: "Run `npm run worker` for BullMQ workers and scheduler",
      });
      return;
    }
    globalForWorkers.__leadOsPricingRuntimeStarted = true;
    const { default: IORedis } = await import("ioredis");
    const { Worker } = await import("bullmq");
    const { runPricingTickJob, runPricingMeasureJob } = await import("./job-processor.ts");

    const url = process.env.REDIS_URL!;
    const mainConnection = new IORedis(url, { maxRetriesPerRequest: null });
    const measureConnection = new IORedis(url, { maxRetriesPerRequest: null });

    const mainWorker = new Worker(
      PRICING_QUEUE_MAIN,
      async (job) => {
        if (job.name === "tick" && job.data?.kind === "tick") {
          await runPricingTickJob(job.data, job.id ?? undefined);
        }
      },
      { connection: mainConnection, concurrency: 1 },
    );

    const measureWorker = new Worker(
      PRICING_QUEUE_MEASURE,
      async (job) => {
        if (job.name === "measure" && job.data?.kind === "measure") {
          await runPricingMeasureJob(job.data);
        }
      },
      { connection: measureConnection, concurrency: 2 },
    );

    mainWorker.on("failed", (job, err) => {
      if (!job) return;
      attachFailedToDlq(PRICING_QUEUE_MAIN, job, err).catch((e) =>
        console.error("[pricing] DLQ main:", e),
      );
    });
    measureWorker.on("failed", (job, err) => {
      if (!job) return;
      attachFailedToDlq(PRICING_QUEUE_MEASURE, job, err).catch((e) =>
        console.error("[pricing] DLQ measure:", e),
      );
    });

    mainWorker.on("error", (err) => console.error("[pricing] main worker error:", err));
    measureWorker.on("error", (err) => console.error("[pricing] measure worker error:", err));

    markWorkersStarted();

    if (opts.enableScheduler) {
      const intervalMs = getPricingTickIntervalMs();
      if (globalForWorkers.__leadOsPricingScheduler) {
        clearInterval(globalForWorkers.__leadOsPricingScheduler);
      }
      globalForWorkers.__leadOsPricingScheduler = setInterval(() => {
        Promise.allSettled([
          tryDistributedSchedulerEnqueue(),
          tryRunAutonomyAgentsByScheduler(),
        ]).catch((err) => console.error("[pricing] scheduler tick:", err));
      }, intervalMs);
      markSchedulerStarted();
      Promise.allSettled([
        tryDistributedSchedulerEnqueue(),
        tryRunAutonomyAgentsByScheduler(),
      ]).catch((err) => console.error("[pricing] initial scheduler tick:", err));
    }
    pricingLog("info", "bullmq_workers_online", {
      scheduler: opts.enableScheduler,
      buildId: process.env.LEAD_OS_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    });
    return;
  }

  if (!isRedisUrlConfigured() && process.env.VERCEL !== "1" && opts.allowMemoryFallback) {
    globalForWorkers.__leadOsPricingRuntimeStarted = true;
    const { startMemoryPricingFallbackScheduler } = await import("./memory-fallback.ts");
    startMemoryPricingFallbackScheduler();
    pricingLog("info", "memory_pricing_scheduler_online", {});
  }
}

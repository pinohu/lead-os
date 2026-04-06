import { OPTIMIZATION_CRONS } from "../optimization-crons.ts";

export interface JobDefinition {
  name: string;
  data: Record<string, unknown>;
  options?: {
    delay?: number;
    priority?: number;
    repeat?: { cron: string };
    attempts?: number;
    backoff?: number;
  };
}

export interface JobStatus {
  id: string;
  queue: string;
  name: string;
  data: Record<string, unknown>;
  status: "waiting" | "active" | "completed" | "failed";
  createdAt: string;
  processedAt?: string;
  failedReason?: string;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback store
// ---------------------------------------------------------------------------

interface InMemoryJob extends JobStatus {
  handler?: (job: JobDefinition) => Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
}

const inMemoryQueues = new Map<string, Map<string, InMemoryJob>>();
const inMemoryWorkers = new Map<string, (job: JobDefinition) => Promise<void>>();
let jobCounter = 0;

function getOrCreateQueue(queue: string): Map<string, InMemoryJob> {
  if (!inMemoryQueues.has(queue)) {
    inMemoryQueues.set(queue, new Map());
  }
  return inMemoryQueues.get(queue)!;
}

function generateJobId(): string {
  return `job-${++jobCounter}-${Date.now()}`;
}

async function processJobInMemory(queue: string, jobId: string): Promise<void> {
  const store = getOrCreateQueue(queue);
  const job = store.get(jobId);
  if (!job || job.status !== "waiting") return;

  job.status = "active";
  job.processedAt = new Date().toISOString();

  const handler = inMemoryWorkers.get(queue);
  if (!handler) {
    job.status = "failed";
    job.failedReason = "No worker registered for this queue";
    return;
  }

  const def: JobDefinition = { name: job.name, data: job.data };
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      await handler(def);
      job.status = "completed";
      return;
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        job.status = "failed";
        job.failedReason = err instanceof Error ? err.message : "Unknown error";
      }
    }
  }
}

// ---------------------------------------------------------------------------
// BullMQ adapter (lazy-loaded when REDIS_URL is present)
// ---------------------------------------------------------------------------

interface BullMQQueue {
  add(name: string, data: Record<string, unknown>, opts?: Record<string, unknown>): Promise<{ id: string | undefined }>;
  addBulk(jobs: { name: string; data: Record<string, unknown>; opts?: Record<string, unknown> }[]): Promise<{ id: string | undefined }[]>;
  getJob(id: string): Promise<BullMQJobInstance | undefined>;
  getWaitingCount(): Promise<number>;
  getActiveCount(): Promise<number>;
  getCompletedCount(): Promise<number>;
  getFailedCount(): Promise<number>;
  close(): Promise<void>;
}

interface BullMQJobInstance {
  id: string | undefined;
  name: string;
  data: Record<string, unknown>;
  getState(): Promise<string>;
  failedReason?: string;
}

interface BullMQWorkerInstance {
  close(): Promise<void>;
}

const bullQueues = new Map<string, BullMQQueue>();
const bullWorkers = new Map<string, BullMQWorkerInstance>();

function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

async function getBullQueue(queue: string): Promise<BullMQQueue> {
  if (bullQueues.has(queue)) return bullQueues.get(queue)!;

  const { Queue } = await import(/* webpackIgnore: true */ "bullmq");
  const connection = {
    url: process.env.REDIS_URL!,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times: number) => Math.min(times * 500, 5000),
  };
  const q = new Queue(queue, { connection }) as unknown as BullMQQueue;
  bullQueues.set(queue, q);
  return q;
}

// ---------------------------------------------------------------------------
// Core public API
// ---------------------------------------------------------------------------

export async function addJob(queue: string, job: JobDefinition): Promise<string> {
  if (isRedisConfigured()) {
    const q = await getBullQueue(queue);
    const opts: Record<string, unknown> = {};
    if (job.options?.delay !== undefined) opts.delay = job.options.delay;
    if (job.options?.priority !== undefined) opts.priority = job.options.priority;
    if (job.options?.attempts !== undefined) opts.attempts = job.options.attempts;
    if (job.options?.backoff !== undefined) opts.backoff = { type: "exponential", delay: job.options.backoff };
    if (job.options?.repeat) opts.repeat = job.options.repeat;

    const added = await q.add(job.name, job.data, opts);
    return added.id ?? generateJobId();
  }

  const store = getOrCreateQueue(queue);
  const id = generateJobId();
  const delay = job.options?.delay ?? 0;

  const entry: InMemoryJob = {
    id,
    queue,
    name: job.name,
    data: job.data,
    status: "waiting",
    createdAt: new Date().toISOString(),
  };
  store.set(id, entry);

  const timer = setTimeout(() => {
    processJobInMemory(queue, id).catch((err) => {
      console.error(`[job-queue] Failed to process job ${id}:`, err);
    });
  }, delay);
  entry.timer = timer;

  return id;
}

export async function addBulkJobs(queue: string, jobs: JobDefinition[]): Promise<string[]> {
  if (isRedisConfigured()) {
    const q = await getBullQueue(queue);
    const bulkJobs = jobs.map((j) => {
      const opts: Record<string, unknown> = {};
      if (j.options?.delay !== undefined) opts.delay = j.options.delay;
      if (j.options?.priority !== undefined) opts.priority = j.options.priority;
      if (j.options?.attempts !== undefined) opts.attempts = j.options.attempts;
      if (j.options?.backoff !== undefined) opts.backoff = { type: "exponential", delay: j.options.backoff };
      return { name: j.name, data: j.data, opts };
    });

    const results = await q.addBulk(bulkJobs);
    return results.map((r, i) => r.id ?? `fallback-${i}`);
  }

  return Promise.all(jobs.map((j) => addJob(queue, j)));
}

export async function getJob(queue: string, jobId: string): Promise<JobStatus | undefined> {
  if (isRedisConfigured()) {
    const q = await getBullQueue(queue);
    const job = await q.getJob(jobId);
    if (!job) return undefined;

    const state = await job.getState();

    return {
      id: job.id ?? jobId,
      queue,
      name: job.name,
      data: job.data,
      status: mapBullMQState(state),
      createdAt: new Date().toISOString(),
      failedReason: job.failedReason,
    };
  }

  const store = getOrCreateQueue(queue);
  const job = store.get(jobId);
  if (!job) return undefined;

  const { timer: _timer, handler: _handler, ...rest } = job;
  return rest;
}

function mapBullMQState(state: string): JobStatus["status"] {
  switch (state) {
    case "active": return "active";
    case "completed": return "completed";
    case "failed": return "failed";
    default: return "waiting";
  }
}

export async function getQueueStats(queue: string): Promise<QueueStats> {
  if (isRedisConfigured()) {
    const q = await getBullQueue(queue);
    const [waiting, active, completed, failed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }

  const store = getOrCreateQueue(queue);
  const jobs = [...store.values()];
  return {
    waiting: jobs.filter((j) => j.status === "waiting").length,
    active: jobs.filter((j) => j.status === "active").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };
}

// ---------------------------------------------------------------------------
// Worker registration
// ---------------------------------------------------------------------------

export function registerWorker(
  queue: string,
  handler: (job: JobDefinition) => Promise<void>,
): void {
  if (isRedisConfigured()) {
    // Lazy BullMQ worker registration - runs async but we don't block
    (async () => {
      const existingWorker = bullWorkers.get(queue);
      if (existingWorker) await existingWorker.close();

      const { Worker } = await import(/* webpackIgnore: true */ "bullmq");
      const connection = { url: process.env.REDIS_URL! };
      const processor = async (job: BullMQJobInstance) => {
          await handler({ name: job.name, data: job.data });
        };
      const worker = new Worker(
        queue,
        processor as unknown as never,
        { connection },
      ) as unknown as BullMQWorkerInstance;
      bullWorkers.set(queue, worker);
    })().catch((err) => console.error(`[job-queue] Failed to register BullMQ worker for ${queue}:`, err));
    return;
  }

  inMemoryWorkers.set(queue, handler);
}

export function removeWorker(queue: string): void {
  if (isRedisConfigured()) {
    const worker = bullWorkers.get(queue);
    if (worker) {
      worker.close().catch(() => {});
      bullWorkers.delete(queue);
    }
    return;
  }

  inMemoryWorkers.delete(queue);
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

const SCHEDULE_TO_CRON: Record<"daily" | "weekly" | "monthly", string> = {
  daily: "0 2 * * *",
  weekly: "0 3 * * 1",
  monthly: "0 4 1 * *",
};

const scheduledJobIds: { name: string; cron: string; nextRun: string }[] = [];

export function scheduleRecurringJobs(): void {
  scheduledJobIds.length = 0;

  for (const cronDef of OPTIMIZATION_CRONS) {
    const cron = SCHEDULE_TO_CRON[cronDef.schedule];
    const jobDef: JobDefinition = {
      name: cronDef.id,
      data: { cronId: cronDef.id, cronName: cronDef.name, schedule: cronDef.schedule },
      options: { repeat: { cron } },
    };

    addJob("optimization-crons", jobDef).catch((err) => {
      console.error(`[job-queue] Failed to schedule cron ${cronDef.id}:`, err);
    });

    scheduledJobIds.push({
      name: cronDef.name,
      cron,
      nextRun: computeNextCronRun(cron),
    });
  }
}

export function getScheduledJobs(): { name: string; cron: string; nextRun: string }[] {
  return [...scheduledJobIds];
}

function computeNextCronRun(cron: string): string {
  // Lightweight next-run estimate without a cron library.
  // Returns a human-readable ISO string for the approximate next occurrence.
  const now = new Date();
  const parts = cron.split(" ");
  const [minuteStr, hourStr, domStr, , dowStr] = parts;

  const target = new Date(now);
  target.setSeconds(0, 0);

  const minute = minuteStr === "*" ? 0 : parseInt(minuteStr, 10);
  const hour = hourStr === "*" ? now.getHours() : parseInt(hourStr, 10);
  target.setMinutes(minute, 0, 0);
  target.setHours(hour);

  if (domStr !== "*") {
    target.setDate(parseInt(domStr, 10));
    if (target <= now) {
      target.setMonth(target.getMonth() + 1);
    }
  } else if (dowStr !== "*") {
    const targetDow = parseInt(dowStr, 10);
    const currentDow = now.getDay();
    let daysUntil = targetDow - currentDow;
    if (daysUntil <= 0) daysUntil += 7;
    target.setDate(now.getDate() + daysUntil);
  } else {
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
  }

  return target.toISOString();
}

// ---------------------------------------------------------------------------
// Testing helper
// ---------------------------------------------------------------------------

export function resetJobQueue(): void {
  for (const store of inMemoryQueues.values()) {
    for (const job of store.values()) {
      if (job.timer) clearTimeout(job.timer);
    }
    store.clear();
  }
  inMemoryQueues.clear();
  inMemoryWorkers.clear();
  bullQueues.clear();
  scheduledJobIds.length = 0;
  jobCounter = 0;
}

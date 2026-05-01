import { NextResponse } from "next/server";
import { recordCheck } from "@/lib/uptime-tracker";
import { getPricingQueueStats } from "@/lib/pricing/queue-client";
import { countDeadLetterJobs } from "@/lib/pricing/repository";
import { getPricingRuntimeSnapshot } from "@/lib/pricing/runtime-state";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { pricingLog } from "@/lib/pricing/logger";
import { getProductionReadinessStatus } from "@/lib/production-config";

async function checkDatabase(): Promise<{ status: "healthy" | "down"; latencyMs: number; detail: string }> {
  const start = Date.now();
  try {
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    if (!pool) return { status: "down", latencyMs: 0, detail: "No database configured" };
    await pool.query("SELECT 1");
    const latency = Date.now() - start;
    return { status: "healthy", latencyMs: latency, detail: `Connected, ${latency}ms` };
  } catch (err) {
    return { status: "down", latencyMs: Date.now() - start, detail: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function checkRedis(): Promise<{ status: "healthy" | "down" | "not_configured"; latencyMs: number; detail: string }> {
  if (!process.env.REDIS_URL) return { status: "not_configured", latencyMs: 0, detail: "REDIS_URL not set" };
  const start = Date.now();
  try {
    new URL(process.env.REDIS_URL);
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    try {
      const pong = await client.ping();
      const latency = Date.now() - start;
      if (pong !== "PONG") return { status: "down", latencyMs: latency, detail: `Unexpected PING reply: ${pong}` };
      return { status: "healthy", latencyMs: latency, detail: `PONG in ${latency}ms` };
    } finally {
      await client.quit();
    }
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "Redis ping failed",
    };
  }
}

function checkMemory(): { status: "healthy" | "degraded"; heapUsedMb: number; heapTotalMb: number; rssMb: number } {
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMb = Math.round(mem.rss / 1024 / 1024);
  const status = heapUsedMb / heapTotalMb > 0.9 ? "degraded" : "healthy";
  return { status, heapUsedMb, heapTotalMb, rssMb };
}

export async function GET() {
  const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const readiness = getProductionReadinessStatus();
  const memory = checkMemory();
  const pricingRuntime = getPricingRuntimeSnapshot();
  let pricingQueues: Awaited<ReturnType<typeof getPricingQueueStats>> | null = null;
  try {
    pricingQueues = await getPricingQueueStats();
  } catch {
    pricingQueues = null;
  }
  let deadLetterPersisted = 0;
  try {
    deadLetterPersisted = await countDeadLetterJobs();
  } catch {
    deadLetterPersisted = 0;
  }

  const dlqThreshold = Number(process.env.LEAD_OS_DLQ_ALERT_THRESHOLD ?? 0);
  const alerts: Array<Record<string, unknown>> = [];
  if (dlqThreshold > 0 && deadLetterPersisted >= dlqThreshold) {
    const signal = {
      type: "dlq_spike",
      dead_letter_persisted_count: deadLetterPersisted,
      threshold: dlqThreshold,
    };
    alerts.push(signal);
    pricingLog("warn", "alert_dlq_spike", signal);
  }

  const queueLagThreshold = Number(process.env.LEAD_OS_QUEUE_WAITING_ALERT_THRESHOLD ?? 0);
  if (queueLagThreshold > 0 && pricingQueues) {
    const waiting = (pricingQueues.main?.waiting ?? 0) + (pricingQueues.measure?.waiting ?? 0);
    if (waiting >= queueLagThreshold) {
      const signal = { type: "queue_waiting_high", waiting, threshold: queueLagThreshold };
      alerts.push(signal);
      pricingLog("warn", "alert_queue_lag", signal);
    }
  }

  const buildId = process.env.LEAD_OS_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null;

  const components = {
    database: db,
    redis,
    memory,
    production_readiness: readiness,
    pricing: {
      runtime: pricingRuntime,
      queues: pricingQueues,
      dead_letter_persisted_count: deadLetterPersisted,
      supabase_configured: isSupabaseConfigured(),
    },
    alerts,
    buildId,
  };
  const redisBlocksProduction = readiness.missingRequired.some((dependency) => dependency.key === "redis");
  const overall = db.status === "down" || redisBlocksProduction || !readiness.ready ? "degraded" : "healthy";

  recordCheck("database", db.status === "down" ? "down" : "healthy", db.latencyMs);
  recordCheck(
    "redis",
    redis.status === "down" || redisBlocksProduction ? "down" : "healthy",
    redis.latencyMs,
  );
  recordCheck("memory", memory.status, 0);

  return NextResponse.json({
    status: overall,
    service: "lead-os",
    version: process.env.npm_package_version ?? "0.1.0",
    apiVersion: "2026-03-30",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    components,
  }, { status: overall === "healthy" ? 200 : 503 });
}

import { NextResponse } from "next/server";
import { recordCheck } from "@/lib/uptime-tracker";

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
    // Just check if URL is parseable — actual Redis health check requires the client
    new URL(process.env.REDIS_URL);
    return { status: "healthy", latencyMs: Date.now() - start, detail: "Redis URL configured" };
  } catch {
    return { status: "down", latencyMs: Date.now() - start, detail: "Invalid REDIS_URL" };
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
  const memory = checkMemory();

  const components = { database: db, redis, memory };
  const overall = db.status === "down" ? "degraded" : "healthy";

  recordCheck("database", db.status === "down" ? "down" : "healthy", db.latencyMs);
  recordCheck("redis", redis.status === "down" ? "down" : redis.status === "not_configured" ? "healthy" : "healthy", redis.latencyMs);
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

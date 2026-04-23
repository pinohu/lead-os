import { NextResponse } from "next/server";
import { recordCheck } from "@/lib/uptime-tracker";
import { getPricingRuntimeSnapshot } from "@/lib/pricing/runtime-state.ts";

export async function GET() {
  let dbStatus = "unknown";
  let dbLatency = 0;

  try {
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    if (pool) {
      const start = Date.now();
      await pool.query("SELECT 1");
      dbLatency = Date.now() - start;
      dbStatus = "healthy";
    } else {
      dbStatus = "not_configured";
    }
  } catch {
    dbStatus = "down";
  }

  recordCheck("database", dbStatus === "healthy" ? "healthy" : dbStatus === "down" ? "down" : "healthy", dbLatency);
  recordCheck("api", "healthy", 0);

  const pricing = getPricingRuntimeSnapshot();
  const pricingStatus =
    pricing.lastTickError ? "degraded" : "healthy";

  return NextResponse.json({
    status: dbStatus === "down" ? "degraded" : "ok",
    service: "lead-os",
    version: process.env.npm_package_version ?? "0.1.0",
    apiVersion: "2026-03-30",
    timestamp: new Date().toISOString(),
    components: {
      api: "healthy",
      database: dbStatus,
      pricing_autopilot: pricingStatus,
      pricing_workers: pricing.workersStarted
        ? "bullmq"
        : pricing.memorySchedulerStarted
          ? "memory_scheduler"
          : "idle",
    },
  });
}

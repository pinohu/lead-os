import { NextResponse } from "next/server";
import { recordCheck } from "@/lib/uptime-tracker";

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

  return NextResponse.json({
    status: dbStatus === "down" ? "degraded" : "ok",
    service: "lead-os",
    version: process.env.npm_package_version ?? "0.1.0",
    apiVersion: "2026-03-30",
    timestamp: new Date().toISOString(),
    components: {
      api: "healthy",
      database: dbStatus,
    },
  });
}

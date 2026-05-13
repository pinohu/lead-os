// ── Health Check Endpoint ─────────────────────────────────────────────
// GET /api/health — Used by uptime monitors and deployment checks.
// Returns minimal info publicly; detailed info requires CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRevenueMonitoringSnapshot } from "@/lib/revenue-monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const start = Date.now();

  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  const totalMs = Date.now() - start;
  const healthy = dbStatus === "ok";

  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isAuthorized) {
    const revenue = await getRevenueMonitoringSnapshot().catch(() => null);
    return NextResponse.json(
      {
        status: healthy && revenue?.status !== "degraded" ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: { status: dbStatus, latencyMs: dbLatencyMs },
          emailService: { configured: !!process.env.EMAILIT_API_KEY },
          revenueMonitoring: revenue,
        },
        responseTimeMs: totalMs,
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      },
      { status: healthy && revenue?.status !== "degraded" ? 200 : 503 }
    );
  }

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded" },
    { status: healthy ? 200 : 503 }
  );
}

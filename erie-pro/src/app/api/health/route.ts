// ── Health Check Endpoint ─────────────────────────────────────────────
// GET /api/health — Used by uptime monitors and deployment checks.
// Returns database connectivity status + basic app info.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
        emailService: { configured: !!process.env.EMAILIT_API_KEY, provider: "emailit" },
      },
      responseTimeMs: totalMs,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    },
    { status: healthy ? 200 : 503 }
  );
}

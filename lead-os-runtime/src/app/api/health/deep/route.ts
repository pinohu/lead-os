// src/app/api/health/deep/route.ts
import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    await healthCheck();
    return NextResponse.json({
      status: "ok",
      components: { database: "healthy" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    log("health_check_failed", { error: message });
    return NextResponse.json(
      {
        status: "degraded",
        components: { database: "down", error: message },
      },
      { status: 503 },
    );
  }
}

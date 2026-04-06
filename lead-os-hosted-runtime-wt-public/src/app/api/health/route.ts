import { NextResponse } from "next/server";
import { getAutomationHealth } from "@/lib/providers";
import { getRuntimePersistenceMode } from "@/lib/runtime-store";

export async function GET() {
  const health = getAutomationHealth();
  return NextResponse.json({
    success: true,
    service: "lead-os-hosted-runtime",
    persistenceMode: getRuntimePersistenceMode(),
    status: health.liveIntegrations > 0 ? "healthy" : "degraded",
    integrationCount: health.liveIntegrations,
  });
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { decideNextStep } from "@/lib/orchestrator";
import { logger } from "@/lib/logger";
import type { FunnelFamily } from "@/lib/runtime-schema";

const VALID_FAMILIES: FunnelFamily[] = [
  "lead-magnet",
  "qualification",
  "chat",
  "webinar",
  "authority",
  "checkout",
  "retention",
  "rescue",
  "referral",
  "continuity",
];



export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const signal = await request.json();
    const preferredFamily = signal.preferredFamily ?? signal.routeSuggestion ?? signal.metadata?.routeSuggestion;
    const normalizedSignal = VALID_FAMILIES.includes(preferredFamily) ? { ...signal, preferredFamily } : signal;
    const decision = decideNextStep(normalizedSignal);
    return NextResponse.json(
      {
        success: true,
        decision,
        traceDefaults: decision.traceDefaults,
        recipe: decision.recipe,
      },
      { headers },
    );
  } catch (err) {
    logger.error("POST /api/decision failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "DECISION_FAILED", message: "Decision failed" } },
      { status: 400, headers },
    );
  }
}

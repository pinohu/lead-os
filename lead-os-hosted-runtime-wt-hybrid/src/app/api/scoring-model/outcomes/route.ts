import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getConversionOutcomes,
  recordConversionOutcome,
  type ConversionOutcome,
} from "@/lib/tenant-scoring-model";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const since = url.searchParams.get("since") ?? undefined;

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "MISSING_PARAM", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const outcomes = await getConversionOutcomes(tenantId, since);
    const convertedCount = outcomes.filter((o) => o.converted).length;

    return NextResponse.json(
      {
        data: outcomes,
        error: null,
        meta: {
          tenantId,
          total: outcomes.length,
          converted: convertedCount,
          conversionRate: outcomes.length > 0
            ? Math.round((convertedCount / outcomes.length) * 10000) / 100
            : 0,
        },
      },
      { headers },
    );
  } catch (err) {
    logger.error("scoring-model/outcomes GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch conversion outcomes" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "MISSING_PARAM", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const raw = await request.json();

    if (!raw?.leadKey || typeof raw.leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 422, headers },
      );
    }
    if (typeof raw.converted !== "boolean") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "converted (boolean) is required" }, meta: null },
        { status: 422, headers },
      );
    }
    if (typeof raw.compositeScoreAtCapture !== "number") {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "compositeScoreAtCapture (number) is required" },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const outcome: ConversionOutcome = {
      leadKey: raw.leadKey,
      tenantId,
      converted: raw.converted,
      revenue: typeof raw.revenue === "number" ? raw.revenue : undefined,
      scoringContext: raw.scoringContext && typeof raw.scoringContext === "object" ? raw.scoringContext : {},
      compositeScoreAtCapture: raw.compositeScoreAtCapture,
      outcomeAt: raw.outcomeAt && typeof raw.outcomeAt === "string" ? raw.outcomeAt : new Date().toISOString(),
    };

    await recordConversionOutcome(outcome);

    return NextResponse.json(
      {
        data: outcome,
        error: null,
        meta: { tenantId, recordedAt: outcome.outcomeAt },
      },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("scoring-model/outcomes POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "RECORD_FAILED", message: "Failed to record conversion outcome" }, meta: null },
      { status: 500, headers },
    );
  }
}

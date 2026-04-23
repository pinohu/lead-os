import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getCurrentModel, getModelHistory, trainScoringModel } from "@/lib/tenant-scoring-model";

export async function GET(request: Request) {
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

    const [current, history] = await Promise.all([
      getCurrentModel(tenantId),
      getModelHistory(tenantId),
    ]);

    return NextResponse.json(
      {
        data: { current, history },
        error: null,
        meta: { tenantId, totalVersions: history.length },
      },
      { headers },
    );
  } catch (err) {
    logger.error("scoring-model GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch scoring model" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const raw = await request.json();
    const tenantId = raw?.tenantId;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "MISSING_PARAM", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const model = await trainScoringModel(tenantId);

    if (!model) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INSUFFICIENT_DATA",
            message: "Not enough conversion outcomes to train a model. Minimum 20 outcomes required.",
          },
          meta: { tenantId },
        },
        { status: 422, headers },
      );
    }

    return NextResponse.json(
      {
        data: model,
        error: null,
        meta: { tenantId, version: model.version, trainedAt: model.trainedAt },
      },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("scoring-model POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "TRAIN_FAILED", message: "Failed to train scoring model" }, meta: null },
      { status: 500, headers },
    );
  }
}

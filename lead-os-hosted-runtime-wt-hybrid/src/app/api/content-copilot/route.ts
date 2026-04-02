import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getCopilotInsights, recordExperimentResult } from "@/lib/content-copilot";

const VALID_CONTENT_TYPES = [
  "headline",
  "cta",
  "email-subject",
  "ad-copy",
  "landing-page",
  "lead-magnet-title",
] as const;

const RecordExperimentSchema = z.object({
  tenantId: z.string().min(1).max(200),
  contentType: z.enum(VALID_CONTENT_TYPES),
  variantA: z.string().min(1).max(2000),
  variantB: z.string().min(1).max(2000),
  winnerVariant: z.enum(["A", "B", "inconclusive"]),
  liftPercent: z.number().min(0).max(10000),
  confidence: z.number().min(0).max(1),
  sampleSize: z.number().int().min(1),
  testedAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId || tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const insights = await getCopilotInsights(tenantId);

    return NextResponse.json(
      { data: insights, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("content-copilot failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to get copilot insights" }, meta: null },
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
    const validation = RecordExperimentSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const { tenantId, contentType, variantA, variantB, winnerVariant, liftPercent, confidence, sampleSize, testedAt } =
      validation.data;

    const result = await recordExperimentResult({
      tenantId,
      contentType,
      variantA,
      variantB,
      winnerVariant,
      liftPercent,
      confidence,
      sampleSize,
      testedAt: testedAt ?? new Date().toISOString(),
    });

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("content-copilot failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "RECORD_FAILED", message: "Failed to record experiment result" }, meta: null },
      { status: 500, headers },
    );
  }
}

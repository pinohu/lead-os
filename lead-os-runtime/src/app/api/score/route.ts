import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  computeCompositeScore,
  computeIntentScore,
  computeFitScore,
  computeEngagementScore,
  computeUrgencyScore,
  classifyLeadTemperature,
  getScoreRecommendation,
  type ScoringContext,
} from "@/lib/scoring-engine";

const SCORING_DIMENSIONS = ["intent", "fit", "engagement", "urgency", "composite"] as const;

const DEFAULT_WEIGHTS = {
  intentWeight: 0.3,
  fitWeight: 0.25,
  engagementWeight: 0.25,
  urgencyWeight: 0.2,
};

const TEMPERATURE_THRESHOLDS = {
  cold: { min: 0, max: 34 },
  warm: { min: 35, max: 59 },
  hot: { min: 60, max: 79 },
  burning: { min: 80, max: 100 },
};

const ScoreRequestSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  signals: z.object({
    source: z.string().min(1, "signals.source is required"),
  }).passthrough(),
});

export async function GET() {
  try {
    return NextResponse.json({
      data: {
        dimensions: SCORING_DIMENSIONS,
        weights: DEFAULT_WEIGHTS,
        temperatureThresholds: TEMPERATURE_THRESHOLDS,
        version: "1.0.0",
      },
      error: null,
    });
  } catch (err) {
    logger.error("GET /api/score failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to retrieve scoring config" } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }

    const parsed = ScoreRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((e) => e.message).join("; "),
            details: parsed.error.issues,
          },
        },
        { status: 422 },
      );
    }

    const { leadId } = parsed.data;
    const signals = body.signals as ScoringContext;

    const intent = computeIntentScore(signals);
    const fit = computeFitScore(signals);
    const engagement = computeEngagementScore(signals);
    const urgency = computeUrgencyScore(signals);
    const composite = computeCompositeScore(signals);

    const temperature = classifyLeadTemperature(composite.score);
    const scores = [intent, fit, engagement, urgency, composite];
    const recommendation = getScoreRecommendation(scores);

    return NextResponse.json({
      data: {
        leadId,
        scores: { intent, fit, engagement, urgency, composite },
        temperature,
        recommendation,
        computedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    logger.error("POST /api/score failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

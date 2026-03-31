import { NextRequest, NextResponse } from "next/server";
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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        dimensions: SCORING_DIMENSIONS,
        weights: DEFAULT_WEIGHTS,
        temperatureThresholds: TEMPERATURE_THRESHOLDS,
        version: "1.0.0",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve scoring config" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { leadId, signals } = body as { leadId?: string; signals?: ScoringContext };
    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json(
        { success: false, error: "leadId is required" },
        { status: 400 },
      );
    }
    if (!signals || typeof signals !== "object" || !signals.source) {
      return NextResponse.json(
        { success: false, error: "signals object with at least a source field is required" },
        { status: 400 },
      );
    }

    const intent = computeIntentScore(signals);
    const fit = computeFitScore(signals);
    const engagement = computeEngagementScore(signals);
    const urgency = computeUrgencyScore(signals);
    const composite = computeCompositeScore(signals);

    const temperature = classifyLeadTemperature(composite.score);
    const scores = [intent, fit, engagement, urgency, composite];
    const recommendation = getScoreRecommendation(scores);

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        scores: { intent, fit, engagement, urgency, composite },
        temperature,
        recommendation,
        computedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

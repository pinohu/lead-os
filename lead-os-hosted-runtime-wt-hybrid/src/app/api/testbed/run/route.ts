import { NextResponse } from "next/server";
import { runTestbed } from "@/lib/vertical-testbed";
import { createRateLimiter } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimiter.check(ip).allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { nicheSlug, sampleSize } = body as {
      nicheSlug?: string;
      sampleSize?: number;
    };

    if (!nicheSlug || typeof nicheSlug !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "nicheSlug is required" } },
        { status: 400 },
      );
    }

    const size = Math.min(Math.max(sampleSize ?? 20, 1), 100);
    const report = await runTestbed(nicheSlug, size);

    return NextResponse.json({
      data: {
        id: report.id,
        nicheSlug: report.nicheSlug,
        sampleSize: report.sampleSize,
        routeDistribution: report.routeDistribution,
        routePercentages: report.routePercentages,
        averageScores: report.averageScores,
        stageFailureRates: report.stageFailureRates,
        avgPipelineDurationMs: report.avgPipelineDurationMs,
        escalationRate: report.escalationRate,
        estimatedRevenuePotential: report.estimatedRevenuePotential,
        recommendations: report.recommendations,
        generatedAt: report.generatedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: { code: "TESTBED_ERROR", message } },
      { status: 500 },
    );
  }
}

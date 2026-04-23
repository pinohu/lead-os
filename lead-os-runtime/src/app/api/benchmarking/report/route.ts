import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateBenchmarkReport } from "@/lib/niche-benchmarking";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const period = searchParams.get("period") ?? undefined;

  if (!tenantId || !tenantId.trim()) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "tenantId query parameter is required",
          details: [{ field: "tenantId", issue: "Must be a non-empty string" }],
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  if (period !== undefined && !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "period must be in YYYY-MM format",
          details: [{ field: "period", issue: "Must match YYYY-MM format" }],
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  const report = await generateBenchmarkReport(tenantId.trim(), period);

  if (!report) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `No snapshot found for tenant "${tenantId}"${period ? ` in period "${period}"` : ""}`,
          details: [],
        },
        meta: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: report,
    error: null,
    meta: {
      tenantId: report.tenantId,
      niche: report.niche,
      period: report.period,
      overallPercentile: report.overallPercentile,
      generatedAt: report.generatedAt,
    },
  });
}

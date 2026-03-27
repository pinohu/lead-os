import { NextResponse } from "next/server";
import { getPipelineStats } from "@/lib/revenue-pipeline";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" } },
      { status: 400 },
    );
  }

  const period = searchParams.get("period") ?? "all";
  const stats = getPipelineStats(tenantId, period);

  return NextResponse.json({ data: stats });
}

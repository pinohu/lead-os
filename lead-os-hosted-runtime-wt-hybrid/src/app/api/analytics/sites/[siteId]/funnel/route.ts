import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getFunnelAnalytics } from "@/lib/integrations/umami-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { siteId } = await params;
    const { searchParams } = new URL(request.url);
    const stepsParam = searchParams.get("steps");

    if (!stepsParam) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "steps query parameter is required (comma-separated paths)" }, meta: null },
        { status: 400, headers },
      );
    }

    const steps = stepsParam.split(",").map((s) => s.trim()).filter(Boolean);

    if (steps.length < 2) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "At least 2 funnel steps are required" }, meta: null },
        { status: 400, headers },
      );
    }

    const data = await getFunnelAnalytics(siteId, steps);

    return NextResponse.json(
      { data, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch funnel analytics";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "FETCH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

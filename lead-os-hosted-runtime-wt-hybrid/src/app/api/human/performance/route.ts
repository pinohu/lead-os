import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { trackHumanPerformance, type RepOutcome } from "@/lib/human-amplification";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const repId = url.searchParams.get("repId");

    if (!repId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "repId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const performance = trackHumanPerformance(repId, []);

    return NextResponse.json(
      { data: performance, error: null, meta: { repId } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PERFORMANCE_FAILED", message: "Failed to retrieve performance metrics" }, meta: null },
      { status: 500, headers },
    );
  }
}

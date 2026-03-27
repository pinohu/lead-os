import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getConversionBenchmarks, exportAnonymizedBenchmarks } from "@/lib/data-moat";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request.headers.get("origin")) });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const niche = url.searchParams.get("niche");
    if (!niche) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const anonymized = url.searchParams.get("anonymized") === "true";
    const data = anonymized ? exportAnonymizedBenchmarks(niche) : getConversionBenchmarks(niche);

    return NextResponse.json({ data, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BENCHMARKS_FAILED", message: "Failed to retrieve benchmarks" }, meta: null },
      { status: 500, headers },
    );
  }
}

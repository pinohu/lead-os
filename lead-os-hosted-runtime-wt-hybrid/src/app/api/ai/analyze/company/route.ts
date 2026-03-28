import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { analyzeCompanyFromWebsite } from "@/lib/integrations/langchain-adapter";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.scrapedContent !== "string" || body.scrapedContent.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "scrapedContent is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const analysis = await analyzeCompanyFromWebsite(body.scrapedContent);
    return NextResponse.json(
      { data: analysis, error: null, meta: { companyName: analysis.name } },
      { status: 200, headers },
    );
  } catch (err) {
    console.error("[ai-analyze-company]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "ANALYSIS_FAILED", message: "Failed to analyze company" }, meta: null },
      { status: 500, headers },
    );
  }
}

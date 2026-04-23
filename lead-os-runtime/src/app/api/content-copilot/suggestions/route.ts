import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getContentSuggestions } from "@/lib/content-copilot";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const type = url.searchParams.get("type");
    const context = url.searchParams.get("context") ?? undefined;

    if (!tenantId || tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!type || type.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "type is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const response = await getContentSuggestions(tenantId, type, context);

    return NextResponse.json(
      {
        data: response,
        error: null,
        meta: {
          aiGenerated: response.aiGenerated,
          suggestionCount: response.suggestions.length,
        },
      },
      { headers },
    );
  } catch (err) {
    logger.error("content-copilot/suggestions failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      {
        data: null,
        error: { code: "SUGGESTIONS_FAILED", message: "Failed to generate content suggestions" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

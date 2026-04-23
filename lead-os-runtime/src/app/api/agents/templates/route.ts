import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listAvailableTemplates } from "@/lib/agent-templates";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const templates = listAvailableTemplates();
    return NextResponse.json(
      { data: templates, error: null, meta: { count: templates.length } },
      { headers },
    );
  } catch (err) {
    logger.error("agents-templates failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list templates" }, meta: null },
      { status: 500, headers },
    );
  }
}

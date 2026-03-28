import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listAvailableTemplates } from "@/lib/agent-templates";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const templates = listAvailableTemplates();
    return NextResponse.json(
      { data: templates, error: null, meta: { count: templates.length } },
      { headers },
    );
  } catch (err) {
    console.error("[agents-templates]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list templates" }, meta: null },
      { status: 500, headers },
    );
  }
}

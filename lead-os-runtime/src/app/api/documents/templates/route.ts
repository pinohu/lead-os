import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listTemplates } from "@/lib/integrations/doc-generator";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? undefined;

    const templates = listTemplates(type);

    return NextResponse.json(
      { data: { templates }, error: null, meta: { count: templates.length } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list templates";
    return NextResponse.json(
      { data: null, error: { code: "LIST_TEMPLATES_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

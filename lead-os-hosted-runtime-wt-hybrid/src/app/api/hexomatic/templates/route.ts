import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getBuiltInTemplates } from "@/lib/integrations/hexomatic-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const templates = getBuiltInTemplates();

    return NextResponse.json(
      { data: templates, error: null, meta: { count: templates.length } },
      { headers },
    );
  } catch (err) {
    console.error("[hexomatic/templates GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch templates" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getEmbedCode } from "@/lib/integrations/embed-widgets-adapter";

export const dynamic = "force-dynamic";

const VALID_FORMATS = new Set(["script", "iframe", "react", "wordpress"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ widgetId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { widgetId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "script";

  if (!VALID_FORMATS.has(format)) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "format must be one of: script, iframe, react, wordpress" }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const embed = await getEmbedCode(widgetId, format as "script" | "iframe" | "react" | "wordpress");
    return NextResponse.json(
      { data: embed, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: err instanceof Error ? err.message : "Widget not found" }, meta: null },
      { status: 404, headers },
    );
  }
}

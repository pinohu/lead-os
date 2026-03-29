import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateWidgetHtml } from "@/lib/integrations/moregoodreviews-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const html = await generateWidgetHtml(id);

    if (!html) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Widget not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("[reviews/widgets/[id]/render GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "RENDER_FAILED", message: "Failed to render widget" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateWidgetEmbed } from "@/lib/integrations/novocall-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const embed = generateWidgetEmbed(id);

    if (!embed) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Widget ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: { widgetId: id, embed }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[novocall/widgets/[id]/embed GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "EMBED_FAILED", message: "Failed to generate embed code" }, meta: null },
      { status: 500, headers },
    );
  }
}

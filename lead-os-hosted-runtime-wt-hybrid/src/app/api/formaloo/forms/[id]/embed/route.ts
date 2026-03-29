import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateEmbedCode } from "@/lib/integrations/formaloo-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const embedCode = await generateEmbedCode(id);

    return NextResponse.json(
      { data: { formId: id, embedCode }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate embed code";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      { data: null, error: { code: isNotFound ? "NOT_FOUND" : "EMBED_FAILED", message }, meta: null },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}

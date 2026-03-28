import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { publishPage } from "@/lib/integrations/grapesjs-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { pageId } = await params;
    const result = await publishPage(pageId);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish page";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "PUBLISH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

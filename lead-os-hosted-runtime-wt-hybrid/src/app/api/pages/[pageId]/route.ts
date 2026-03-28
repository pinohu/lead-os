import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getPage, updatePage, deletePage } from "@/lib/integrations/grapesjs-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { pageId } = await params;
    const page = await getPage(pageId);

    return NextResponse.json({ data: { page }, error: null, meta: null }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch page";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "FETCH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const { pageId } = await params;
    const body = await request.json();

    const page = await updatePage(pageId, body);

    return NextResponse.json({ data: { page }, error: null, meta: null }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update page";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "UPDATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { pageId } = await params;
    await deletePage(pageId);

    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete page";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "DELETE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

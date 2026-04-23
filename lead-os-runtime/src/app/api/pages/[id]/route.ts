import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { deletePage, getPage, updatePage } from "@/lib/page-builder";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_BLOCKS = 100;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const page = getPage(id);

    if (!page) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Page "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: page, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch page" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body.title !== undefined && (typeof body.title !== "string" || body.title.length > MAX_TITLE_LENGTH)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `title must be a string under ${MAX_TITLE_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > MAX_DESCRIPTION_LENGTH)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `description must be a string under ${MAX_DESCRIPTION_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.blocks !== undefined && Array.isArray(body.blocks) && body.blocks.length > MAX_BLOCKS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `blocks must not exceed ${MAX_BLOCKS}` }, meta: null },
        { status: 400, headers },
      );
    }

    const updated = updatePage(id, body);

    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Page "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: updated, error: null, meta: null }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update page";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 409 ? "CONFLICT" : "UPDATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const deleted = deletePage(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Page "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete page" }, meta: null },
      { status: 500, headers },
    );
  }
}

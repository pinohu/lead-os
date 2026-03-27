import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { deleteForm, getForm, updateForm } from "@/lib/page-builder";

const MAX_NAME_LENGTH = 200;
const MAX_FIELDS = 50;

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const form = getForm(id);

    if (!form) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Form "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: form, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch form" }, meta: null },
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

    if (body.name !== undefined && (typeof body.name !== "string" || body.name.length > MAX_NAME_LENGTH)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `name must be a string under ${MAX_NAME_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.fields !== undefined && Array.isArray(body.fields) && body.fields.length > MAX_FIELDS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `fields must not exceed ${MAX_FIELDS}` }, meta: null },
        { status: 400, headers },
      );
    }

    const updated = updateForm(id, body);

    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Form "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: updated, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update form" }, meta: null },
      { status: 500, headers },
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
    const deleted = deleteForm(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Form "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete form" }, meta: null },
      { status: 500, headers },
    );
  }
}

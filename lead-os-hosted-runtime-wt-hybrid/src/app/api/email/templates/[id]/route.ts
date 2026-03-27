import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  deleteTemplate,
  getDefaultTemplates,
  getTemplate,
  updateTemplate,
  type EmailTemplate,
} from "@/lib/email-templates";

const VALID_CATEGORIES = new Set<EmailTemplate["category"]>(["nurture", "transactional", "notification", "marketing", "system"]);
const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 500;
const MAX_TEMPLATE_BODY_LENGTH = 100_000;

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
    getDefaultTemplates();
    const { id } = await params;
    const template = getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Template "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: template, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch template" }, meta: null },
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

    if (body.subject !== undefined && (typeof body.subject !== "string" || body.subject.length > MAX_SUBJECT_LENGTH)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `subject must be a string under ${MAX_SUBJECT_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.category !== undefined && !VALID_CATEGORIES.has(body.category)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.htmlTemplate !== undefined && (typeof body.htmlTemplate !== "string" || body.htmlTemplate.length > MAX_TEMPLATE_BODY_LENGTH)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `htmlTemplate must be a string under ${MAX_TEMPLATE_BODY_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    getDefaultTemplates();
    const updated = updateTemplate(id, body);

    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Template "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: updated, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update template" }, meta: null },
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
    const deleted = deleteTemplate(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Template "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete template" }, meta: null },
      { status: 500, headers },
    );
  }
}

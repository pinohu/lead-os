import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createTemplate,
  getDefaultTemplates,
  listTemplates,
  type EmailTemplate,
} from "@/lib/email-templates";

const VALID_CATEGORIES = new Set<EmailTemplate["category"]>(["nurture", "transactional", "notification", "marketing", "system"]);
const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 500;
const MAX_TEMPLATE_BODY_LENGTH = 100_000;

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    getDefaultTemplates();

    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const category = url.searchParams.get("category") as EmailTemplate["category"] | null;

    const templates = listTemplates(
      tenantId,
      category && VALID_CATEGORIES.has(category) ? category : undefined,
    );

    return NextResponse.json(
      { data: templates, error: null, meta: { count: templates.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list templates" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    if (!body.id || typeof body.id !== "string" || body.id.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "id is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "name is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `name must not exceed ${MAX_NAME_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.subject || typeof body.subject !== "string" || body.subject.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "subject is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `subject must not exceed ${MAX_SUBJECT_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.category || !VALID_CATEGORIES.has(body.category)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.htmlTemplate || typeof body.htmlTemplate !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "htmlTemplate is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.htmlTemplate.length > MAX_TEMPLATE_BODY_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `htmlTemplate must not exceed ${MAX_TEMPLATE_BODY_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    const template = createTemplate({
      id: body.id.trim(),
      name: body.name.trim(),
      subject: body.subject.trim(),
      category: body.category,
      htmlTemplate: body.htmlTemplate,
      textTemplate: body.textTemplate ?? "",
      variables: Array.isArray(body.variables) ? body.variables : [],
      tenantId: body.tenantId,
    });

    return NextResponse.json(
      { data: template, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create template";
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

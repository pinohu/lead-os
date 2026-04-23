import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createForm, listForms, type FormField } from "@/lib/page-builder";

const MAX_NAME_LENGTH = 200;
const MAX_FIELDS = 50;
const MAX_SUCCESS_MESSAGE_LENGTH = 1000;
const VALID_SUBMIT_ACTIONS = new Set(["intake", "subscribe", "custom-webhook"]);
const VALID_FIELD_TYPES = new Set<FormField["type"]>(["text", "email", "phone", "select", "textarea", "checkbox", "radio", "number", "date", "file", "hidden"]);

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const forms = listForms(tenantId);

    return NextResponse.json(
      { data: forms, error: null, meta: { count: forms.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list forms" }, meta: null },
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

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
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

    if (!body.submitAction || !VALID_SUBMIT_ACTIONS.has(body.submitAction)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `submitAction must be one of: ${[...VALID_SUBMIT_ACTIONS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!Array.isArray(body.fields)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "fields must be an array" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.fields.length > MAX_FIELDS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `fields must not exceed ${MAX_FIELDS}` }, meta: null },
        { status: 400, headers },
      );
    }

    for (const field of body.fields) {
      if (!field.type || !VALID_FIELD_TYPES.has(field.type)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `Invalid field type: ${field.type}` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.successMessage && body.successMessage.length > MAX_SUCCESS_MESSAGE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `successMessage must not exceed ${MAX_SUCCESS_MESSAGE_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    const form = createForm({
      tenantId: body.tenantId,
      name: body.name.trim(),
      fields: body.fields,
      submitAction: body.submitAction,
      submitUrl: body.submitUrl,
      successMessage: body.successMessage ?? "Thank you for your submission!",
      redirectUrl: body.redirectUrl,
    });

    return NextResponse.json(
      { data: form, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create form";
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

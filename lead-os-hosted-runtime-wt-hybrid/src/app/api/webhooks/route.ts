import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { registerWebhook, listWebhooks } from "@/lib/webhook-registry";

const MAX_URL_LENGTH = 2048;
const MAX_EVENTS = 50;

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const authenticatedTenantId = request.headers.get("x-authenticated-tenant-id");
    if (authenticatedTenantId && tenantId !== authenticatedTenantId) {
      return NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "tenantId does not match authenticated tenant" }, meta: null },
        { status: 403, headers },
      );
    }

    const webhooks = await listWebhooks(tenantId);
    return NextResponse.json(
      { data: webhooks, error: null, meta: { count: webhooks.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list webhooks" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const authenticatedTenantId = request.headers.get("x-authenticated-tenant-id");
    if (authenticatedTenantId && body.tenantId !== authenticatedTenantId) {
      return NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "tenantId does not match authenticated tenant" }, meta: null },
        { status: 403, headers },
      );
    }

    if (!body.url || typeof body.url !== "string" || body.url.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "url is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.url.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `url must not exceed ${MAX_URL_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "url must be a valid URL" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "events must be a non-empty array of strings" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.events.length > MAX_EVENTS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `events must not exceed ${MAX_EVENTS} entries` }, meta: null },
        { status: 400, headers },
      );
    }

    for (const event of body.events) {
      if (typeof event !== "string" || event.trim().length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Each event must be a non-empty string" }, meta: null },
          { status: 400, headers },
        );
      }
    }

    const webhook = await registerWebhook(body.tenantId, body.url.trim(), body.events);

    return NextResponse.json(
      { data: webhook, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to register webhook" }, meta: null },
      { status: 500, headers },
    );
  }
}

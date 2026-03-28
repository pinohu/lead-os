import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getWebhook, updateWebhook, deleteWebhook } from "@/lib/webhook-registry";

const VALID_STATUSES = new Set(["active", "paused"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const webhook = await getWebhook(id);

    if (!webhook) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Webhook not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: webhook, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch webhook" }, meta: null },
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
    const { id } = await params;
    const body = await request.json();

    const patch: Partial<{ url: string; events: string[]; status: "active" | "paused" }> = {};

    if (body.url !== undefined) {
      if (typeof body.url !== "string" || body.url.trim().length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "url must be a non-empty string" }, meta: null },
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
      patch.url = body.url.trim();
    }

    if (body.events !== undefined) {
      if (!Array.isArray(body.events) || body.events.length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "events must be a non-empty array" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.events = body.events;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${[...VALID_STATUSES].join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }
      patch.status = body.status;
    }

    const updated = await updateWebhook(id, patch);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Webhook not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update webhook" }, meta: null },
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
    const deleted = await deleteWebhook(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Webhook not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete webhook" }, meta: null },
      { status: 500, headers },
    );
  }
}

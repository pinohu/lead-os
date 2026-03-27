import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  addToSuppressionList,
  getSuppressionList,
  removeFromSuppressionList,
  type SuppressionEntry,
} from "@/lib/email-sender";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_REASONS = new Set<SuppressionEntry["reason"]>(["bounce", "complaint", "unsubscribe", "manual"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

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

    const entries = await getSuppressionList(tenantId);

    return NextResponse.json(
      { data: entries, error: null, meta: { count: entries.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list suppression entries" }, meta: null },
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

    if (!body.email || typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email must be a valid email address" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.reason || !VALID_REASONS.has(body.reason)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `reason must be one of: ${[...VALID_REASONS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const entry = await addToSuppressionList(body.email, body.reason, body.tenantId);

    return NextResponse.json(
      { data: entry, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "ADD_FAILED", message: "Failed to add suppression entry" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(request: Request) {
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

    if (!body.email || typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email must be a valid email address" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const removed = await removeFromSuppressionList(body.email, body.tenantId);

    if (!removed) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Email not found in suppression list" }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "REMOVE_FAILED", message: "Failed to remove suppression entry" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { requestDeletion, processDeletion, listDeletionRequests } from "@/lib/gdpr";

const MAX_EMAIL_LENGTH = 254;

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

    const requests = await listDeletionRequests(tenantId);
    return NextResponse.json(
      { data: requests, error: null, meta: { count: requests.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list deletion requests" }, meta: null },
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

    if (!body.email || typeof body.email !== "string" || body.email.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `email must not exceed ${MAX_EMAIL_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    const deletionRequest = await requestDeletion(body.tenantId, body.email.trim().toLowerCase());

    processDeletion(deletionRequest.id).catch((err: unknown) => {
      logger.error(`Deletion request ${deletionRequest.id} failed:`, { error: err instanceof Error ? err.message : String(err) });
    });

    return NextResponse.json(
      { data: deletionRequest, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create deletion request" }, meta: null },
      { status: 500, headers },
    );
  }
}

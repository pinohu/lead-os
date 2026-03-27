import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { exportUserData } from "@/lib/gdpr";

const MAX_EMAIL_LENGTH = 254;

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
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

    const userData = await exportUserData(body.tenantId, body.email.trim().toLowerCase());

    return NextResponse.json(
      { data: userData, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "EXPORT_FAILED", message: "Failed to export user data" }, meta: null },
      { status: 500, headers },
    );
  }
}

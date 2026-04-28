import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  addToSuppressionList,
  removeFromSuppressionList,
  isEmailSuppressed,
} from "@/lib/email-sender";
import { createSelfServiceToken, verifySelfServiceToken } from "@/lib/self-service-tokens";

/**
 * Email preference center API.
 * Token-authenticated so leads can manage their email preferences without logging in.
 */

function generateToken(email: string, tenantId: string): string {
  return createSelfServiceToken("preferences", email, tenantId, 32) ?? "";
}

function validateToken(email: string, tenantId: string, token: string): boolean {
  return verifySelfServiceToken("preferences", email, tenantId, token, 32);
}

/**
 * GET /api/preferences?email=X&tenant=Y&token=Z
 * Returns current email preferences for the lead.
 */
export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const tenantId = url.searchParams.get("tenant");
  const token = url.searchParams.get("token");

  if (!email || !tenantId || !token) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "email, tenant, and token are required" }, meta: null },
      { status: 400, headers },
    );
  }
  if (!process.env.LEAD_OS_AUTH_SECRET?.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Self-service links are not configured" }, meta: null },
      { status: 503, headers },
    );
  }

  if (!validateToken(email, tenantId, token)) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_TOKEN", message: "Invalid or expired link." }, meta: null },
      { status: 403, headers },
    );
  }

  try {
    const suppressed = await isEmailSuppressed(email, tenantId);

    return NextResponse.json({
      data: {
        email,
        preferences: {
          allEmails: !suppressed,
          nurture: !suppressed,
          marketing: !suppressed,
          transactional: true,
        },
      },
      error: null,
      meta: null,
    }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to load preferences." }, meta: null },
      { status: 500, headers },
    );
  }
}

/**
 * POST /api/preferences
 * Updates email preferences.
 * Body: { email, tenant, token, preferences: { allEmails: boolean } }
 */
export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const tenantId = body.tenant;
    const token = body.token;

    if (!email || !tenantId || !token) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email, tenant, and token are required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!process.env.LEAD_OS_AUTH_SECRET?.trim()) {
      return NextResponse.json(
        { data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Self-service links are not configured" }, meta: null },
        { status: 503, headers },
      );
    }

    if (!validateToken(email, tenantId, token)) {
      return NextResponse.json(
        { data: null, error: { code: "INVALID_TOKEN", message: "Invalid or expired link." }, meta: null },
        { status: 403, headers },
      );
    }

    const preferences = body.preferences;
    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "preferences object is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (preferences.allEmails === false) {
      await addToSuppressionList(email, "unsubscribe", tenantId);
    } else if (preferences.allEmails === true) {
      await removeFromSuppressionList(email, tenantId);
    }

    return NextResponse.json({
      data: {
        email,
        preferences: {
          allEmails: preferences.allEmails !== false,
          nurture: preferences.allEmails !== false,
          marketing: preferences.allEmails !== false,
          transactional: true,
        },
        message: preferences.allEmails === false
          ? "You have been unsubscribed from all marketing emails. You will still receive essential transactional emails."
          : "Your email preferences have been updated. You will receive emails from us again.",
      },
      error: null,
      meta: null,
    }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update preferences." }, meta: null },
      { status: 500, headers },
    );
  }
}

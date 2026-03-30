import { NextResponse } from "next/server";
import {
  getSamlConfig,
  parseSamlResponse,
} from "@/lib/sso";
import {
  createSessionToken,
  isAllowedOperatorEmail,
  OPERATOR_SESSION_COOKIE,
} from "@/lib/operator-auth";
import { logAuthEvent } from "@/lib/agent-audit-log";

// ---------------------------------------------------------------------------
// POST /api/auth/sso/saml/callback
// Handles the SAML Assertion Consumer Service (ACS) callback:
//   1. Reads SAMLResponse from form POST body
//   2. Parses the SAML assertion to extract user identity
//   3. Creates an operator session
//   4. Redirects to /dashboard
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const config = getSamlConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "SAML SSO is not configured" },
      { status: 501 },
    );
  }

  // ── Parse form body ─────────────────────────────────────────────────────
  let samlResponse: string;
  try {
    const formData = await request.formData();
    samlResponse = (formData.get("SAMLResponse") as string) ?? "";
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form body — expected SAMLResponse" },
      { status: 400 },
    );
  }

  if (!samlResponse) {
    return NextResponse.json(
      { success: false, error: "Missing SAMLResponse" },
      { status: 400 },
    );
  }

  // ── Parse SAML assertion ────────────────────────────────────────────────
  const user = parseSamlResponse(samlResponse, config);

  if (!user || !user.email) {
    logAuthEvent("sso.saml.parse_failed", process.env.LEAD_OS_TENANT_ID ?? "default", {
      reason: "saml_parse_failed",
    });
    return NextResponse.json(
      { success: false, error: "Could not extract identity from SAML response" },
      { status: 400 },
    );
  }

  // ── Verify operator access ──────────────────────────────────────────────
  if (!isAllowedOperatorEmail(user.email)) {
    logAuthEvent("sso.saml.denied", process.env.LEAD_OS_TENANT_ID ?? "default", {
      email: user.email,
      reason: "not_allowed_operator",
      provider: "saml",
    });
    return NextResponse.json(
      { success: false, error: "Access denied — email not authorized" },
      { status: 403 },
    );
  }

  // ── Create session ──────────────────────────────────────────────────────
  const token = await createSessionToken(user.email);

  logAuthEvent("sso.saml.login", process.env.LEAD_OS_TENANT_ID ?? "default", {
    email: user.email,
    name: user.name,
    sub: user.sub,
    provider: "saml",
  });

  // ── Redirect to dashboard with session cookie ───────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const response = NextResponse.redirect(`${siteUrl}/dashboard`);

  response.cookies.set({
    name: OPERATOR_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  // Clear SAML flow cookie
  response.cookies.set({ name: "leados_saml_relay", value: "", maxAge: 0, path: "/" });

  return response;
}

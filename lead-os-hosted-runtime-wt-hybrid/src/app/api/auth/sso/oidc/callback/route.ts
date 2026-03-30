import { NextResponse } from "next/server";
import {
  getOidcConfig,
  exchangeOidcCode,
  parseIdToken,
} from "@/lib/sso";
import {
  createSessionToken,
  isAllowedOperatorEmail,
  OPERATOR_SESSION_COOKIE,
} from "@/lib/operator-auth";
import { logAuthEvent } from "@/lib/agent-audit-log";

// ---------------------------------------------------------------------------
// GET /api/auth/sso/oidc/callback
// Handles the OIDC authorization code callback:
//   1. Validates state parameter against cookie
//   2. Exchanges code for tokens
//   3. Parses the ID token to extract user info
//   4. Creates an operator session (same as magic-link auth)
//   5. Redirects to /dashboard
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const config = getOidcConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "OIDC SSO is not configured" },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    const desc = url.searchParams.get("error_description") ?? error;
    return NextResponse.json(
      { success: false, error: `IdP error: ${desc}` },
      { status: 400 },
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { success: false, error: "Missing code or state parameter" },
      { status: 400 },
    );
  }

  // ── Validate state ──────────────────────────────────────────────────────
  const cookieHeader = request.headers.get("cookie") ?? "";
  const storedState = parseCookie(cookieHeader, "leados_oidc_state");

  if (!storedState || storedState !== state) {
    return NextResponse.json(
      { success: false, error: "State mismatch — possible CSRF" },
      { status: 403 },
    );
  }

  // ── Exchange code for tokens ────────────────────────────────────────────
  let idToken: string;
  try {
    const tokens = await exchangeOidcCode(config, code);
    idToken = tokens.idToken;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 },
    );
  }

  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "No ID token returned from IdP" },
      { status: 502 },
    );
  }

  // ── Parse user info ─────────────────────────────────────────────────────
  let user;
  try {
    user = await parseIdToken(idToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ID token parsing failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 400 },
    );
  }

  // ── Verify operator access ──────────────────────────────────────────────
  if (!isAllowedOperatorEmail(user.email)) {
    logAuthEvent("sso.oidc.denied", process.env.LEAD_OS_TENANT_ID ?? "default", {
      email: user.email,
      reason: "not_allowed_operator",
      provider: "oidc",
    });
    return NextResponse.json(
      { success: false, error: "Access denied — email not authorized" },
      { status: 403 },
    );
  }

  // ── Create session ──────────────────────────────────────────────────────
  const token = await createSessionToken(user.email);

  logAuthEvent("sso.oidc.login", process.env.LEAD_OS_TENANT_ID ?? "default", {
    email: user.email,
    name: user.name,
    sub: user.sub,
    provider: "oidc",
  });

  // ── Redirect to dashboard with session cookie ───────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
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

  // Clear OIDC flow cookies
  response.cookies.set({ name: "leados_oidc_state", value: "", maxAge: 0, path: "/" });
  response.cookies.set({ name: "leados_oidc_nonce", value: "", maxAge: 0, path: "/" });

  return response;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCookie(header: string, name: string): string | null {
  const match = header
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

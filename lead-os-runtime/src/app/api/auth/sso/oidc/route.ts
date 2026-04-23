import { NextResponse } from "next/server";
import {
  getOidcConfig,
  buildOidcAuthorizationUrl,
  generateRandomState,
} from "@/lib/sso";

// ---------------------------------------------------------------------------
// GET /api/auth/sso/oidc
// Initiates OIDC login — redirects the browser to the IdP authorization URL.
// State and nonce are stored in httpOnly cookies for CSRF protection.
// ---------------------------------------------------------------------------

export async function GET() {
  const config = getOidcConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "OIDC SSO is not configured" },
      { status: 501 },
    );
  }

  const state = generateRandomState();
  const nonce = generateRandomState();

  const authUrl = buildOidcAuthorizationUrl(config, state, nonce);

  const response = NextResponse.redirect(authUrl);

  // Store state + nonce in secure cookies for validation in the callback
  response.cookies.set({
    name: "leados_oidc_state",
    value: state,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  response.cookies.set({
    name: "leados_oidc_nonce",
    value: nonce,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}

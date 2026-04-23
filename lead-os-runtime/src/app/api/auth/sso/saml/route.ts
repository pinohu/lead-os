import { NextResponse } from "next/server";
import {
  getSamlConfig,
  buildSamlAuthnRequest,
  generateRandomState,
} from "@/lib/sso";

// ---------------------------------------------------------------------------
// GET /api/auth/sso/saml
// Initiates SAML login — redirects the browser to the IdP SSO URL with an
// AuthnRequest via HTTP-Redirect binding.
// ---------------------------------------------------------------------------

export async function GET() {
  const config = getSamlConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "SAML SSO is not configured" },
      { status: 501 },
    );
  }

  const samlRequest = buildSamlAuthnRequest(config);
  const relayState = generateRandomState();

  // Build redirect URL with SAMLRequest and RelayState
  const params = new URLSearchParams({
    SAMLRequest: samlRequest,
    RelayState: relayState,
  });

  const redirectUrl = `${config.idpSsoUrl}?${params.toString()}`;

  const response = NextResponse.redirect(redirectUrl);

  // Store RelayState for validation in the callback
  response.cookies.set({
    name: "leados_saml_relay",
    value: relayState,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}

import { NextResponse } from "next/server";
import {
  applyOperatorSession,
  createSessionToken,
  createOperatorAuthUrl,
  getTrustedOperatorAuthRequest,
  sanitizeNextPath,
  verifyMagicLinkToken,
} from "@/lib/operator-auth";

function invalidLinkRedirect() {
  return NextResponse.redirect(createOperatorAuthUrl("/auth/sign-in?error=invalid-link"));
}

export async function GET(request: Request) {
  const authRequest = getTrustedOperatorAuthRequest(request);
  if (!authRequest.trusted) {
    return NextResponse.json(
      { success: false, error: "Untrusted request host" },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const requestedNext = sanitizeNextPath(url.searchParams.get("next"));

  if (!token) {
    return invalidLinkRedirect();
  }

  const payload = await verifyMagicLinkToken(token, authRequest.tokenAudience);
  if (!payload) {
    return invalidLinkRedirect();
  }

  const sessionToken = await createSessionToken(payload.email);
  const response = NextResponse.redirect(new URL(payload.next ?? requestedNext, authRequest.canonicalOrigin));
  applyOperatorSession(response, sessionToken);
  return response;
}

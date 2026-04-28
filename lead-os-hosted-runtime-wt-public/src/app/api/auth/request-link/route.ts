import { NextResponse } from "next/server";
import {
  createOperatorAuthUrl,
  getTrustedOperatorAuthRequest,
  isAllowedOperatorEmail,
  sanitizeNextPath,
  sendOperatorMagicLink,
} from "@/lib/operator-auth";

function redirectWithError(message: string, nextPath: string) {
  const url = createOperatorAuthUrl("/auth/sign-in");
  url.searchParams.set("error", message);
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

function rejectUntrustedHost() {
  return NextResponse.json(
    { success: false, error: "Untrusted request host" },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const authRequest = getTrustedOperatorAuthRequest(request);
  if (!authRequest.trusted) {
    return rejectUntrustedHost();
  }

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nextPath = sanitizeNextPath(String(formData.get("next") ?? "/dashboard"));

  if (!email || !isAllowedOperatorEmail(email)) {
    return redirectWithError("unauthorized", nextPath);
  }

  const result = await sendOperatorMagicLink(email, nextPath);
  if (!result.ok) {
    return redirectWithError("delivery-failed", nextPath);
  }

  const url = createOperatorAuthUrl("/auth/check-email");
  url.searchParams.set("email", email);
  return NextResponse.redirect(url);
}

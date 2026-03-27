import { NextResponse } from "next/server";
import { isAllowedOperatorEmail, sendOperatorMagicLink } from "@/lib/operator-auth";
import { getUserByEmail, createUser, createSession } from "@/lib/auth-system";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Email is required" }, meta: null },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const tenantId = tenantConfig.tenantId;

  if (!isAllowedOperatorEmail(email)) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Email not authorized" }, meta: null },
      { status: 403 },
    );
  }

  let user = await getUserByEmail(email, tenantId);
  if (!user) {
    user = await createUser({
      email,
      name: email.split("@")[0],
      tenantId,
      role: "owner",
      status: "active",
    });
  }

  if (user.status === "suspended") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Account is suspended" }, meta: null },
      { status: 403 },
    );
  }

  const origin = new URL(request.url).origin;
  const result = await sendOperatorMagicLink(email, origin, "/dashboard");
  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: { code: "DELIVERY_FAILED", message: "Failed to send magic link" }, meta: null },
      { status: 500 },
    );
  }

  const sessionResult = await createSession(user.id);

  return NextResponse.json({
    data: {
      message: "Magic link sent. Check your email.",
      sessionToken: sessionResult?.token,
    },
    error: null,
    meta: null,
  });
}

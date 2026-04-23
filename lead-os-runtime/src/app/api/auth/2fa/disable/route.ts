import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { validateTotpCode } from "@/lib/totp";
import { logAuthEvent } from "@/lib/agent-audit-log";

export async function POST(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;
  if (!context) return NextResponse.json({ data: null, error: { code: "UNAUTHORIZED", message: "Not authenticated" }, meta: null }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { code, secret } = body as { code?: string; secret?: string };

  if (!code || !secret) {
    return NextResponse.json({ data: null, error: { code: "INVALID_INPUT", message: "code and secret are required" }, meta: null }, { status: 400 });
  }

  if (!validateTotpCode(secret, code)) {
    return NextResponse.json({ data: null, error: { code: "INVALID_CODE", message: "Current TOTP code required to disable 2FA" }, meta: null }, { status: 400 });
  }

  logAuthEvent("2fa.disabled", context.tenantId, { userId: context.userId });

  return NextResponse.json({
    data: { enabled: false },
    error: null,
    meta: { message: "2FA has been disabled." },
  });
}

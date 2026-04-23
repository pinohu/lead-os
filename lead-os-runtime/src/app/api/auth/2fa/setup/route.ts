import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { generateTotpSecret, generateTotpUri } from "@/lib/totp";

export async function POST(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;
  if (!context) return NextResponse.json({ data: null, error: { code: "UNAUTHORIZED", message: "Not authenticated" }, meta: null }, { status: 401 });

  const secret = generateTotpSecret();
  const uri = generateTotpUri(secret, context.userId ?? "user", "CX React");

  return NextResponse.json({
    data: { secret, uri, qrData: uri },
    error: null,
    meta: { message: "Scan the QR code with your authenticator app, then verify with /api/auth/2fa/verify" },
  });
}

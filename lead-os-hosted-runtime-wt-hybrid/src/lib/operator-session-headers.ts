import { createHmac, timingSafeEqual } from "crypto";

export type OperatorHeaderSession = {
  email: string;
  tenantId?: string;
  type: "session";
  exp: number;
};

function verifyMiddlewareIdentitySignature(
  signature: string,
  userId: string,
  tenantId: string,
  requestId: string,
) {
  const secret = process.env.LEAD_OS_AUTH_SECRET ?? "";
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(`${userId}:${tenantId}:${requestId}`)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function getSignedOperatorSessionFromHeaders(headers: Headers): OperatorHeaderSession | null {
  const userId = headers.get("x-authenticated-user-id");
  const method = headers.get("x-authenticated-method");
  const role = headers.get("x-authenticated-role");
  const tenantId = headers.get("x-authenticated-tenant-id") ?? "";
  const requestId = headers.get("x-request-id");
  const signature = headers.get("x-middleware-signature");

  if (
    !userId ||
    !method ||
    (role !== "owner" && role !== "admin") ||
    !requestId ||
    !signature ||
    !verifyMiddlewareIdentitySignature(signature, userId, tenantId, requestId)
  ) {
    return null;
  }

  return { email: userId, tenantId: tenantId || undefined, type: "session", exp: 0 };
}

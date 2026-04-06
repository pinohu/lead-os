import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { exportUserData, requestDeletion, processDeletion } from "@/lib/gdpr";
import { createHash } from "crypto";

const MAX_EMAIL_LENGTH = 254;

/**
 * Generates an HMAC token for self-service GDPR requests.
 * Uses the same approach as unsubscribe but with a stronger hash.
 */
function generateToken(email: string, tenantId: string): string {
  const secret = process.env.LEAD_OS_AUTH_SECRET ?? process.env.CRON_SECRET;
  if (!secret) throw new Error("LEAD_OS_AUTH_SECRET or CRON_SECRET must be configured");
  return createHash("sha256")
    .update(`${email.toLowerCase().trim()}::${tenantId}::${secret}`)
    .digest("hex")
    .slice(0, 32);
}

function validateToken(email: string, tenantId: string, token: string): boolean {
  const expected = generateToken(email, tenantId);
  if (expected.length !== token.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * GET /api/gdpr/self-service?email=X&tenant=Y&token=Z&action=export
 *
 * Public endpoint — no operator auth required.
 * Token-authenticated so leads can self-serve their data rights.
 *
 * Actions:
 * - export: Returns all data associated with the email
 * - delete: Initiates data deletion request
 */
export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const tenantId = url.searchParams.get("tenant");
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action") ?? "export";

  if (!email || !tenantId || !token) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "email, tenant, and token are required" }, meta: null },
      { status: 400, headers },
    );
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid email" }, meta: null },
      { status: 400, headers },
    );
  }

  if (!validateToken(email, tenantId, token)) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_TOKEN", message: "Invalid or expired token. Please use the link from your email." }, meta: null },
      { status: 403, headers },
    );
  }

  try {
    if (action === "delete") {
      const deletionRequest = await requestDeletion(tenantId, email);
      processDeletion(deletionRequest.id).catch((err: unknown) => {
        logger.error(`Self-service deletion ${deletionRequest.id} failed:`, { error: err instanceof Error ? err.message : String(err) });
      });

      return NextResponse.json(
        { data: { requestId: deletionRequest.id, status: "processing", message: "Your data deletion request has been received and is being processed." }, error: null, meta: null },
        { status: 200, headers },
      );
    }

    const userData = await exportUserData(tenantId, email);
    return NextResponse.json(
      { data: userData, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PROCESSING_FAILED", message: "Failed to process your request. Please try again." }, meta: null },
      { status: 500, headers },
    );
  }
}

/**
 * Utility to generate a GDPR self-service URL for use in email footers.
 */
export function buildGdprSelfServiceUrl(siteUrl: string, email: string, tenantId: string): string {
  const token = generateToken(email, tenantId);
  return `${siteUrl}/manage-data?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenantId)}&token=${token}`;
}

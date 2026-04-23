import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { recordEmailEvent } from "@/lib/email-tracking";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

// Max lengths guard against memory-exhaustion via unbounded string accumulation.
const MAX_LEAD_KEY_LENGTH = 128;
const MAX_EMAIL_ID_LENGTH = 128;
// Alphanumeric + hyphens/underscores only — rejects injection attempts stored in memory.
const SAFE_ID_PATTERN = /^[\w-]{1,128}$/;

const trackingStore: Array<{
  leadKey: string;
  emailId: string;
  event: "opened";
  timestamp: string;
  ip?: string;
  userAgent?: string;
}> = [];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leadKey = url.searchParams.get("leadKey");
  const emailId = url.searchParams.get("emailId");

  if (leadKey && emailId) {
    const leadKeyValid =
      leadKey.length <= MAX_LEAD_KEY_LENGTH && SAFE_ID_PATTERN.test(leadKey);
    const emailIdValid =
      emailId.length <= MAX_EMAIL_ID_LENGTH && SAFE_ID_PATTERN.test(emailId);

    if (leadKeyValid && emailIdValid) {
      // Only log the first IP address from x-forwarded-for to avoid logging
      // attacker-controlled proxy chains.
      const rawForwardedFor = request.headers.get("x-forwarded-for");
      const clientIp = rawForwardedFor
        ? rawForwardedFor.split(",")[0].trim()
        : undefined;

      trackingStore.push({
        leadKey,
        emailId,
        event: "opened",
        timestamp: new Date().toISOString(),
        ip: clientIp,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      recordEmailEvent({
        leadKey,
        emailId,
        eventType: "opened",
      }).catch(() => {
        // Persistence failure must not break the pixel response
      });

      // Fire-and-forget rescore after email open
      import("@/lib/rescore-engine")
        .then((m) => m.rescoreLead(leadKey, { type: "email-open" }))
        .catch(() => {});
    }
    // Invalid params: silently skip recording but always return the pixel so
    // email clients do not display broken images.
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-cache, no-store, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      ...buildCorsHeaders(request.headers.get("origin")),
    },
  });
}


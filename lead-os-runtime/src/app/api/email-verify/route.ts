import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  verifySingleEmail,
  verifyBulkEmails,
  verifyAndStore,
  getVerificationStats,
  shouldSendToEmail,
} from "@/lib/integrations/reoon-adapter";

const SingleEmailSchema = z.object({
  email: z.string().email(),
});

const BulkEmailSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(100),
});

const BodySchema = z.union([SingleEmailSchema, BulkEmailSchema]);

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = BodySchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const body = validation.data;

    if ("emails" in body) {
      const results = await verifyBulkEmails(body.emails);
      const stored = await Promise.all(
        body.emails.map((email) => verifyAndStore(email)),
      );
      return NextResponse.json(
        {
          data: stored.map((r) => ({ ...r, sendable: shouldSendToEmail(r) })),
          error: null,
          meta: { count: results.length },
        },
        { headers },
      );
    }

    const result = await verifyAndStore(body.email);
    return NextResponse.json(
      {
        data: { ...result, sendable: shouldSendToEmail(result) },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch (err) {
    logger.error("email-verify POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "VERIFY_FAILED", message: "Email verification failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const stats = await getVerificationStats(tenantId);

    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("email-verify GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "STATS_FAILED", message: "Failed to retrieve verification stats" }, meta: null },
      { status: 500, headers },
    );
  }
}

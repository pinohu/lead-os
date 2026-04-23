import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  sendReviewRequest,
  sendBulkReviewRequests,
  listReviewRequests,
} from "@/lib/integrations/moregoodreviews-adapter";

const SendRequestSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(200),
  businessName: z.string().min(1).max(200),
  templateId: z.string().optional(),
  tenantId: z.string().min(1).optional(),
});

const BulkSendSchema = z.object({
  requests: z.array(SendRequestSchema).min(1).max(100),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const requests = await listReviewRequests(tenantId);

    return NextResponse.json(
      { data: requests, error: null, meta: { count: requests.length } },
      { headers },
    );
  } catch (err) {
    logger.error("reviews/requests GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch review requests" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();

    const bulkValidation = BulkSendSchema.safeParse(raw);
    if (bulkValidation.success) {
      const results = await sendBulkReviewRequests(bulkValidation.data.requests);
      return NextResponse.json(
        { data: results, error: null, meta: { count: results.length } },
        { status: 201, headers },
      );
    }

    const singleValidation = SendRequestSchema.safeParse(raw);
    if (!singleValidation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: singleValidation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const result = await sendReviewRequest(singleValidation.data);
    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("reviews/requests POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to send review request" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  recordCall,
  listCalls,
} from "@/lib/integrations/callscaler-adapter";

const RecordCallSchema = z.object({
  trackingNumberId: z.string().min(1),
  callerNumber: z.string().min(1),
  callerName: z.string().optional(),
  callerCity: z.string().optional(),
  callerState: z.string().optional(),
  duration: z.number().int().min(0),
  status: z.enum(["completed", "missed", "voicemail", "busy"]),
  source: z.string().min(1),
  campaign: z.string().optional(),
  recording: z.string().url().optional(),
  startedAt: z.string().datetime(),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = RecordCallSchema.safeParse(raw);

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

    const call = await recordCall(validation.data);
    return NextResponse.json(
      { data: call, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("callscaler/calls POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "RECORD_FAILED", message: "Failed to record call" }, meta: null },
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
    const filter: Record<string, string | undefined> = {};

    for (const key of ["trackingNumberId", "source", "campaign", "status", "tenantId", "dateFrom", "dateTo"]) {
      const value = url.searchParams.get(key);
      if (value) filter[key] = value;
    }

    const hasFilter = Object.keys(filter).length > 0;
    const calls = await listCalls(hasFilter ? filter : undefined);

    return NextResponse.json(
      { data: calls, error: null, meta: { count: calls.length } },
      { headers },
    );
  } catch (err) {
    logger.error("callscaler/calls GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list calls" }, meta: null },
      { status: 500, headers },
    );
  }
}

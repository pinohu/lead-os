import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { ingestEvent, ingestBulkEvents } from "@/lib/integrations/meiro-cdp-adapter";

const EventSchema = z.object({
  profileId: z.string().min(1),
  source: z.string().min(1),
  eventType: z.string().min(1),
  properties: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  timestamp: z.string().datetime().optional(),
});

const BulkEventsSchema = z.object({
  events: z.array(EventSchema).min(1).max(1000),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();

    if (Array.isArray(raw.events)) {
      const validation = BulkEventsSchema.safeParse(raw);
      if (!validation.success) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
          { status: 422, headers },
        );
      }
      const events = await ingestBulkEvents(
        validation.data.events.map((e) => ({
          ...e,
          timestamp: e.timestamp ?? new Date().toISOString(),
        })),
      );
      return NextResponse.json(
        { data: events, error: null, meta: { count: events.length } },
        { status: 201, headers },
      );
    }

    const validation = EventSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const event = await ingestEvent({
      ...validation.data,
      timestamp: validation.data.timestamp ?? new Date().toISOString(),
    });

    return NextResponse.json(
      { data: event, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("meiro/events POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "INGEST_FAILED", message: "Failed to ingest event" }, meta: null },
      { status: 500, headers },
    );
  }
}

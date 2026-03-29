import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  trackEvent,
  trackBulkEvents,
  listEvents,
} from "@/lib/integrations/owox-adapter";

const MarketingEventSchema = z.object({
  source: z.string().min(1),
  medium: z.string().min(1),
  campaign: z.string().optional(),
  channel: z.string().min(1),
  action: z.string().min(1),
  value: z.number().optional(),
  leadId: z.string().optional(),
  tenantId: z.string().optional(),
  timestamp: z.string().optional(),
});

const BulkEventsSchema = z.object({
  events: z.array(MarketingEventSchema).min(1).max(1000),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();

    // Detect bulk vs single
    if (raw.events && Array.isArray(raw.events)) {
      const validation = BulkEventsSchema.safeParse(raw);
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

      const events = await trackBulkEvents(
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

    const validation = MarketingEventSchema.safeParse(raw);
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

    const event = await trackEvent({
      ...validation.data,
      timestamp: validation.data.timestamp ?? new Date().toISOString(),
    });

    return NextResponse.json(
      { data: event, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[owox/events POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to track event" }, meta: null },
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
    const source = url.searchParams.get("source") ?? undefined;
    const channel = url.searchParams.get("channel") ?? undefined;
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;

    const events = await listEvents({ source, channel, tenantId, dateFrom, dateTo });

    return NextResponse.json(
      { data: events, error: null, meta: { count: events.length } },
      { headers },
    );
  } catch (err) {
    console.error("[owox/events GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch events" }, meta: null },
      { status: 500, headers },
    );
  }
}

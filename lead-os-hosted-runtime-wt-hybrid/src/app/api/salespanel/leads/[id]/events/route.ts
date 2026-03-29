import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { trackEvent } from "@/lib/integrations/salespanel-adapter";

const TrackEventSchema = z.object({
  eventName: z.string().min(1),
  eventValue: z.string().optional(),
  url: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const raw = await request.json();
    const validation = TrackEventSchema.safeParse(raw);

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

    const lead = await trackEvent({
      leadId: id,
      eventName: validation.data.eventName,
      eventValue: validation.data.eventValue,
      url: validation.data.url,
      tenantId: validation.data.tenantId,
    });

    if (!lead) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Lead ${id} not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: lead, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[salespanel/leads/id/events POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "TRACK_FAILED", message: "Failed to track event" }, meta: null },
      { status: 500, headers },
    );
  }
}

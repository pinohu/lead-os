import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createBooking } from "@/lib/integrations/scheduling";

const CreateBookingSchema = z.object({
  tenantId: z.string().min(1),
  leadKey: z.string().min(1),
  eventTypeId: z.string().min(1),
  startTime: z.string().min(1),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues.map((i) => ({
              field: i.path.join("."),
              issue: i.message,
            })),
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId, ...bookingInput } = parsed.data;
    const booking = await createBooking(tenantId, bookingInput);

    return NextResponse.json(
      { data: { booking }, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    return NextResponse.json(
      { data: null, error: { code: "BOOKING_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

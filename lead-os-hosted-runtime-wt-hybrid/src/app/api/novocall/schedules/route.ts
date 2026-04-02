import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createSchedule,
  getAvailableSlots,
} from "@/lib/integrations/novocall-adapter";

const CreateScheduleSchema = z.object({
  name: z.string().min(1),
  availableSlots: z.array(z.object({
    day: z.string().min(1),
    start: z.string().min(1),
    end: z.string().min(1),
  })),
  timezone: z.string().min(1),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateScheduleSchema.safeParse(raw);

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

    const schedule = await createSchedule(validation.data);
    return NextResponse.json(
      { data: schedule, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("novocall/schedules POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create schedule" }, meta: null },
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
    const scheduleId = url.searchParams.get("scheduleId");
    const date = url.searchParams.get("date");

    if (scheduleId && date) {
      const slots = await getAvailableSlots(scheduleId, date);
      return NextResponse.json(
        { data: slots, error: null, meta: { count: slots.length } },
        { headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "MISSING_PARAMS", message: "scheduleId and date query parameters are required" }, meta: null },
      { status: 400, headers },
    );
  } catch (err) {
    logger.error("novocall/schedules GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch available slots" }, meta: null },
      { status: 500, headers },
    );
  }
}

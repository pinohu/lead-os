import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getAvailableSlots } from "@/lib/integrations/scheduling";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { searchParams } = new URL(request.url);
    const eventTypeId = searchParams.get("eventTypeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!eventTypeId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventTypeId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "dateFrom and dateTo are required" }, meta: null },
        { status: 400, headers },
      );
    }

    const slots = await getAvailableSlots(eventTypeId, dateFrom, dateTo);

    return NextResponse.json(
      { data: { slots }, error: null, meta: { count: slots.length } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch slots";
    return NextResponse.json(
      { data: null, error: { code: "SLOTS_FETCH_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

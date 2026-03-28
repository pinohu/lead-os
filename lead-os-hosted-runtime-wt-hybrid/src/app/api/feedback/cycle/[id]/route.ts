import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getFeedbackCycle } from "@/lib/feedback-engine";

const MAX_ID_LENGTH = 64;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Feedback cycle not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const cycle = await getFeedbackCycle(id);

    if (!cycle) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Feedback cycle not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: cycle, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch feedback cycle" }, meta: null },
      { status: 500, headers },
    );
  }
}

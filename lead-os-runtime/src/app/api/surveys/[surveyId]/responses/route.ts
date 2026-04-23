import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getResponses } from "@/lib/integrations/formbricks-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { surveyId } = await params;
    const responses = await getResponses(surveyId);

    return NextResponse.json(
      { data: { responses }, error: null, meta: { count: responses.length } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch responses";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "FETCH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

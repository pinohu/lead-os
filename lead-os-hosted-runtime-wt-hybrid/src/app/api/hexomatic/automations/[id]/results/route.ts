import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getAutomationResults,
  exportResults,
} from "@/lib/integrations/hexomatic-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format === "csv") {
      const csv = await exportResults(id, "csv");
      return new Response(csv, {
        status: 200,
        headers: {
          ...Object.fromEntries(headers.entries()),
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="results-${id}.csv"`,
        },
      });
    }

    const results = await getAutomationResults(id);

    return NextResponse.json(
      { data: results, error: null, meta: { count: results.length } },
      { headers },
    );
  } catch (err) {
    console.error("[hexomatic/automations/[id]/results GET]", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Failed to fetch results";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

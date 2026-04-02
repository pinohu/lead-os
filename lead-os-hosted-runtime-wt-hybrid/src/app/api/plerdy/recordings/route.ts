import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { listSessionRecordings } from "@/lib/integrations/plerdy-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const filterUrl = url.searchParams.get("url") ?? undefined;
    const minDuration = url.searchParams.get("minDuration");
    const device = url.searchParams.get("device") ?? undefined;

    const recordings = await listSessionRecordings({
      url: filterUrl,
      minDuration: minDuration ? Number(minDuration) : undefined,
      device,
    });

    return NextResponse.json(
      { data: recordings, error: null, meta: { count: recordings.length } },
      { headers },
    );
  } catch (err) {
    logger.error("plerdy/recordings GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch recordings" }, meta: null },
      { status: 500, headers },
    );
  }
}

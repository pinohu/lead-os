import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getHeatmapData } from "@/lib/integrations/plerdy-adapter";
import type { DeviceType } from "@/lib/integrations/plerdy-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Missing required 'url' parameter" }, meta: null },
        { status: 422, headers },
      );
    }

    const device = (url.searchParams.get("device") ?? "desktop") as DeviceType;
    const period = url.searchParams.get("period") ?? "7d";

    const heatmap = await getHeatmapData(targetUrl, device, period);

    return NextResponse.json(
      { data: heatmap, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("plerdy/heatmaps GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch heatmap data" }, meta: null },
      { status: 500, headers },
    );
  }
}

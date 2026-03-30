import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { calculateTimeSaved } from "@/lib/joy-engine";

/** GET – returns the time-saved report for the current period */
export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const tenantId = context?.tenantId ?? "default";
  const url = new URL(request.url);
  const days = Math.min(
    Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1),
    365,
  );

  const report = await calculateTimeSaved(tenantId, days);

  return NextResponse.json({ data: report, error: null, meta: null });
}

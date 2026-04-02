import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  sendCampaign,
  getCampaignStats,
} from "@/lib/integrations/acumbamail-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const stats = await getCampaignStats(id);

    if (!stats) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Campaign not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: { campaignId: id, stats }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[acumbamail/campaigns/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch campaign stats" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const campaign = await sendCampaign(id);

    return NextResponse.json(
      { data: campaign, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[acumbamail/campaigns/[id] POST]", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to send campaign";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "SEND_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getCampaign,
  pauseCampaign,
  resumeCampaign,
  updateCampaignMetrics,
} from "@/lib/integrations/markopolo-adapter";

const PatchSchema = z.object({
  action: z.enum(["pause", "resume", "metrics"]),
  metrics: z.object({
    impressions: z.number().int().min(0).optional(),
    clicks: z.number().int().min(0).optional(),
    conversions: z.number().int().min(0).optional(),
    spend: z.number().min(0).optional(),
  }).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Campaign not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: campaign, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[markopolo/campaigns/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch campaign" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const raw = await request.json();
    const validation = PatchSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { action, metrics } = validation.data;
    let campaign;

    switch (action) {
      case "pause":
        campaign = await pauseCampaign(id);
        break;
      case "resume":
        campaign = await resumeCampaign(id);
        break;
      case "metrics":
        if (!metrics) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: "Metrics object required for metrics action" }, meta: null },
            { status: 422, headers },
          );
        }
        campaign = await updateCampaignMetrics(id, metrics);
        break;
    }

    return NextResponse.json(
      { data: campaign, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[markopolo/campaigns/[id] PATCH]", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to update campaign";
    const status = message.includes("not found") ? 404 : 422;
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

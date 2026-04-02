import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createCampaign, listCampaigns } from "@/lib/integrations/markopolo-adapter";

const PlatformSchema = z.enum(["facebook", "google", "tiktok", "snapchat", "linkedin"]);

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  platform: PlatformSchema,
  audienceId: z.string().min(1),
  budget: z.number().positive(),
  budgetType: z.enum(["daily", "lifetime"]),
  tenantId: z.string().max(200).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") as "facebook" | "google" | "tiktok" | "snapchat" | "linkedin" | null;
    const status = url.searchParams.get("status") as "active" | "paused" | "completed" | "draft" | null;
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const campaigns = await listCampaigns({
      platform: platform ?? undefined,
      status: status ?? undefined,
      tenantId,
    });

    return NextResponse.json(
      { data: campaigns, error: null, meta: { count: campaigns.length } },
      { headers },
    );
  } catch (err) {
    logger.error("markopolo/campaigns GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list campaigns" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateCampaignSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const campaign = await createCampaign(validation.data);

    return NextResponse.json(
      { data: campaign, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("markopolo/campaigns POST failed", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to create campaign";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

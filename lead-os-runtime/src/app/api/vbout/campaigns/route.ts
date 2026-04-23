import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createCampaign,
} from "@/lib/integrations/vbout-adapter";

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  fromName: z.string().min(1).max(200),
  fromEmail: z.string().email(),
  htmlBody: z.string().min(1),
  listIds: z.array(z.string()),
  scheduledAt: z.string().datetime().optional(),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    return NextResponse.json(
      { data: [], error: null, meta: { count: 0 } },
      { headers },
    );
  } catch (err) {
    logger.error("vbout/campaigns GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch campaigns" }, meta: null },
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
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const campaign = await createCampaign(validation.data);

    return NextResponse.json(
      { data: campaign, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("vbout/campaigns POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create campaign" }, meta: null },
      { status: 500, headers },
    );
  }
}

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createCampaign,
  sendTransactionalEmail,
  listCampaigns,
} from "@/lib/integrations/groove-adapter";

const CreateCampaignSchema = z.object({
  type: z.literal("campaign"),
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  htmlBody: z.string().min(1),
  textBody: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  listId: z.string().optional(),
});

const SendTransactionalSchema = z.object({
  type: z.literal("transactional"),
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  htmlBody: z.string().min(1),
  textBody: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
});

const PostSchema = z.discriminatedUnion("type", [CreateCampaignSchema, SendTransactionalSchema]);

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;

    const campaigns = await listCampaigns(tenantId);

    return NextResponse.json(
      { data: campaigns, error: null, meta: { count: campaigns.length } },
      { headers },
    );
  } catch (err) {
    logger.error("groove/mail GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list campaigns" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = PostSchema.safeParse(raw);

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

    const data = validation.data;

    if (data.type === "campaign") {
      const campaign = await createCampaign(
        data.tenantId,
        data.name,
        data.subject,
        data.htmlBody,
        {
          textBody: data.textBody,
          fromName: data.fromName,
          fromEmail: data.fromEmail,
          listId: data.listId,
        },
      );
      return NextResponse.json(
        { data: campaign, error: null, meta: null },
        { status: 201, headers },
      );
    }

    // type === "transactional"
    const result = await sendTransactionalEmail(
      data.to,
      data.subject,
      data.htmlBody,
      data.textBody,
      data.fromName,
      data.fromEmail,
    );

    return NextResponse.json(
      { data: result, error: null, meta: { operator: session.email } },
      { status: 200, headers },
    );
  } catch (err) {
    logger.error("groove/mail POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "SEND_FAILED", message: "Failed to process email request" }, meta: null },
      { status: 500, headers },
    );
  }
}

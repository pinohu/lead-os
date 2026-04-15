// ── Webhook Endpoint Management ───────────────────────────────────────
// GET:    List webhooks for authenticated provider
// POST:   Register new webhook endpoint
// DELETE: Remove webhook endpoint
// PATCH:  Test webhook endpoint

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { sendTestWebhook } from "@/lib/webhook-delivery";
import { checkFetchableUrl } from "@/lib/url-safety";
import crypto from "crypto";
import { z } from "zod";

const ALLOWED_EVENTS = [
  "lead.created",
  "lead.routed",
  "lead.outcome",
  "lead.disputed",
];

/** Resolve the authenticated user's provider ID */
async function getProviderId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerId: true },
  });
  return user?.providerId ?? null;
}

// ── GET: List Webhooks ─────────────────────────────────────────────
export async function GET() {
  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        failCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, endpoints });
  } catch (err) {
    logger.error("webhooks", "Failed to list webhooks:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── POST: Register New Webhook ─────────────────────────────────────
// URL is validated with checkFetchableUrl at submit time to reject SSRF
// targets (private IPs, .local hostnames, URLs with embedded credentials).
// We still re-validate at delivery time in webhook-delivery.ts in case a
// record was inserted through another path (admin tooling, migrations).
const CreateWebhookSchema = z.object({
  url: z
    .string()
    .url("Must be a valid HTTPS URL")
    .superRefine((url, ctx) => {
      const result = checkFetchableUrl(url);
      if (!result.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.reason });
      }
    }),
  events: z
    .array(z.enum(ALLOWED_EVENTS as [string, ...string[]]))
    .min(1, "At least one event is required"),
});

export async function POST(req: NextRequest) {
  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = CreateWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    // Limit webhooks per provider
    const count = await prisma.webhookEndpoint.count({ where: { providerId } });
    if (count >= 5) {
      return NextResponse.json(
        { success: false, error: "Maximum of 5 webhook endpoints allowed" },
        { status: 400 }
      );
    }

    // Generate signing secret
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        providerId,
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
      },
    });

    audit({
      action: "admin.action",
      entityType: "provider",
      entityId: endpoint.id,
      providerId,
      metadata: { type: "webhook.created", url: parsed.data.url },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      endpoint: {
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        secret, // Return secret once on creation
        isActive: endpoint.isActive,
        createdAt: endpoint.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error("webhooks", "Failed to create webhook:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE: Remove Webhook ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const endpointId = body?.id as string;
    if (!endpointId) {
      return NextResponse.json({ success: false, error: "Endpoint ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, providerId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Webhook not found" }, { status: 404 });
    }

    await prisma.webhookEndpoint.delete({ where: { id: endpointId } });

    audit({
      action: "admin.action",
      entityType: "provider",
      entityId: endpointId,
      providerId,
      metadata: { type: "webhook.deleted", url: existing.url },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Webhook removed" });
  } catch (err) {
    logger.error("webhooks", "Failed to delete webhook:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH: Test Webhook Endpoint ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const providerId = await getProviderId();
    if (!providerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const endpointId = body?.id as string;
    if (!endpointId) {
      return NextResponse.json({ success: false, error: "Endpoint ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, providerId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Webhook not found" }, { status: 404 });
    }

    const result = await sendTestWebhook(endpointId);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      error: result.error,
    });
  } catch (err) {
    logger.error("webhooks", "Failed to test webhook:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

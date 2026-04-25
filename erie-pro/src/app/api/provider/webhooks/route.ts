// ── Webhook Endpoint Management ───────────────────────────────────────
// GET:    List webhooks for authenticated provider
// POST:   Register new webhook endpoint
// DELETE: Remove webhook endpoint
// PATCH:  Test webhook endpoint

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { sendTestWebhook } from "@/lib/webhook-delivery";
import { checkFetchableUrl } from "@/lib/url-safety";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";
import { z } from "zod";

const ALLOWED_EVENTS = [
  "lead.created",
  "lead.routed",
  "lead.outcome",
  "lead.disputed",
];

/** Hard cap on webhook endpoints per provider. */
const MAX_WEBHOOKS = 5;

/** Sentinel thrown inside the create transaction to signal cap exceeded. */
class WebhookCapExceeded extends Error {}

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
  // Throttle before any DB / crypto / audit writes: POST mints a signing
  // secret and an audit row per call, PATCH burns an outbound HTTP
  // request per call. Reusing the `api-keys` preset (20/min) matches
  // the existing "session-gated management action" pattern.
  const limited = await checkRateLimit(req, "api-keys");
  if (limited) return limited;

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

    // Generate signing secret up front so the Serializable transaction
    // window only holds DB work.
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    // Atomic count-then-create: see /api/provider/api-keys for the same
    // pattern. Parallel POSTs from a single session could otherwise all
    // observe count < 5 and mint 5+ endpoints before any of them wrote.
    // Postgres SSI catches the predicate conflict and aborts all but
    // one concurrent writer; the typed sentinel distinguishes real cap
    // rejections from retry-able serialization failures.
    let endpoint: Awaited<ReturnType<typeof prisma.webhookEndpoint.create>>;
    try {
      endpoint = await prisma.$transaction(
        async (tx) => {
          const count = await tx.webhookEndpoint.count({ where: { providerId } });
          if (count >= MAX_WEBHOOKS) {
            throw new WebhookCapExceeded();
          }
          return tx.webhookEndpoint.create({
            data: {
              providerId,
              url: parsed.data.url,
              events: parsed.data.events,
              secret,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof WebhookCapExceeded) {
        return NextResponse.json(
          { success: false, error: `Maximum of ${MAX_WEBHOOKS} webhook endpoints allowed` },
          { status: 400 }
        );
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        return NextResponse.json(
          { success: false, error: "Concurrent request conflict — retry." },
          { status: 429 }
        );
      }
      throw err;
    }

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
  // Match POST / PATCH. DELETE was the odd one out — no rate limit
  // meant a compromised session could churn through endpoint deletions
  // and generate an audit row per call. Owners are capped at 5
  // endpoints, so a "churn" is only 5 DELETEs, but the audit-row spam
  // is the real cost: an attacker can flood `audit_log` with
  // webhook.deleted rows to hide other activity in the same window.
  // The `api-keys` preset is the same gate the rest of this file uses.
  const limited = await checkRateLimit(req, "api-keys");
  if (limited) return limited;

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
  // Each call fires an outbound HTTP request to the provider's
  // webhook URL (see sendTestWebhook). Without throttling, a
  // compromised session becomes a free outbound-request generator —
  // the per-URL SSRF validator already blocks private IPs, but an
  // attacker could still run arbitrary outbound traffic at whatever
  // request rate their session allows. Match POST's preset.
  const limited = await checkRateLimit(req, "api-keys");
  if (limited) return limited;

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

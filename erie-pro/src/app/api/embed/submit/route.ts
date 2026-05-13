// ── Embed Form Submission Endpoint ────────────────────────────────────
// Same logic as /api/leads/inbound but designed for the embeddable widget.
// Always returns CORS headers for cross-origin usage.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { routeLead } from "@/lib/lead-routing";
import { syncLeadToBoostspace } from "@/lib/lead-external-sync";
import { recordRevenueActionPlan } from "@/lib/revenue-actions";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit-log";
import { deliverWebhookEvent } from "@/lib/webhook-delivery";
import crypto from "crypto";

// ── CORS Preflight ─────────────────────────────────────────────────
export async function OPTIONS(req: NextRequest) {
  const origin = resolveEmbedOrigin(req.headers.get("origin"));
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

const EmbedLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7).optional(),
  message: z.string().optional(),
  niche: z.string().min(1).optional(),
  sourcePage: z.string().max(1000).optional(),
  requestedProviderName: z.string().max(200).optional(),
  requestedProviderSlug: z.string().max(200).optional(),
  requestedProviderPhone: z.string().max(40).optional(),
  requestedProviderAddress: z.string().max(500).optional(),
  routingIntent: z.enum(["general", "provider_specific"]).optional(),
});

export async function POST(req: NextRequest) {
  const origin = resolveEmbedOrigin(req.headers.get("origin"));
  try {
    // Rate limit
    const rateLimited = await checkRateLimit(req, "lead");
    if (rateLimited) return addCors(rateLimited, origin);

    // Validate API key
    const apiKeyRaw = req.headers.get("x-api-key");
    if (!apiKeyRaw) {
      return corsJson({ success: false, error: "Missing API key" }, 401, origin);
    }

    const keyHash = crypto.createHash("sha256").update(apiKeyRaw).digest("hex");
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { provider: true },
    });

    if (!apiKey || !apiKey.isActive) {
      return corsJson({ success: false, error: "Invalid API key" }, 401, origin);
    }

    if (!hasApiPermission(apiKey.permissions, ["leads:write", "embed:submit"])) {
      return corsJson({ success: false, error: "API key is not permitted to submit embedded leads" }, 403, origin);
    }

    // Update lastUsedAt
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body) return corsJson({ success: false, error: "Invalid JSON" }, 400, origin);

    const parsed = EmbedLeadSchema.safeParse(body);
    if (!parsed.success) {
      return corsJson(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        400,
        origin
      );
    }

    const data = parsed.data;
    const niche = data.niche || apiKey.provider.niche;
    const nameParts = data.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Suppression check
    const suppressed = await prisma.suppression.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });
    if (suppressed) {
      return corsJson({ success: false, error: "Contact opted out" }, 403, origin);
    }

    // Route the lead
    const tcpaIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "embed";

    const result = await routeLead(niche, apiKey.provider.city, {
      firstName,
      lastName,
      phone: data.phone || "",
      email: data.email,
      message: data.message,
      source: "embed",
      sourcePage: data.sourcePage,
      routingIntent: data.routingIntent ?? (data.requestedProviderSlug || data.requestedProviderName ? "provider_specific" : "general"),
      requestedProviderName: data.requestedProviderName,
      requestedProviderSlug: data.requestedProviderSlug,
      requestedProviderPhone: data.requestedProviderPhone,
      requestedProviderAddress: data.requestedProviderAddress,
      timestamp: new Date().toISOString(),
      tcpaConsent: true,
      tcpaConsentText: "Submitted via embedded lead form widget",
      tcpaConsentAt: new Date().toISOString(),
      tcpaIpAddress: tcpaIp,
    });

    // Audit
    audit({
      action: "lead.routed",
      entityType: "lead",
      entityId: result.leadId,
      providerId: apiKey.providerId,
      metadata: { niche, source: "embed", apiKeyId: apiKey.id },
    }).catch(() => {});

    // Deliver webhook events
    if (result.routedTo) {
      deliverWebhookEvent(result.routedTo.id, "lead.created", {
        leadId: result.leadId,
        niche,
        firstName,
        lastName,
        email: data.email,
        routeType: result.routeType,
      }).catch(() => {});
    }

    syncLeadToBoostspace(result.leadId).catch((error) => {
      logger.error("api/embed/submit", "Boost.space sync failed:", error);
    });
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "embed",
      eventType: result.routedTo ? "lead.routed" : "lead.submitted",
      customerEmail: data.email,
      serviceSlug: niche,
      serviceLabel: niche,
      sourcePage: data.sourcePage,
      sourcePageType: "embed_lead_form",
      metadata: {
        leadId: result.leadId,
        routeType: result.routeType,
        providerId: apiKey.providerId,
        apiKeyId: apiKey.id,
        routedToId: result.routedTo?.id ?? null,
        routedToName: result.routedTo?.businessName ?? null,
        routingIntent: data.routingIntent ?? (data.requestedProviderSlug || data.requestedProviderName ? "provider_specific" : "general"),
        requestedProviderName: data.requestedProviderName ?? null,
        requestedProviderSlug: data.requestedProviderSlug ?? null,
      },
    }).catch((error) => {
      logger.error("api/embed/submit", "Revenue action plan failed:", error);
      return null;
    });

    return corsJson({
      success: true,
      leadId: result.leadId,
      routedTo: result.routedTo?.businessName ?? "Queued",
      actionPlan: actionPlanResult?.plan ?? null,
    }, 200, origin);
  } catch (err) {
    logger.error("api/embed/submit", "Error:", err);
    return corsJson({ success: false, error: "Internal server error" }, 500, origin);
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function resolveEmbedOrigin(origin: string | null): string {
  if (!origin) return "";
  const allowedOrigins = (process.env.EMBED_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  if (allowedOrigins.length === 0) return origin;
  return allowedOrigins.includes(origin) ? origin : "";
}

function corsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Vary": "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function corsJson(data: unknown, status = 200, origin?: string): NextResponse {
  return NextResponse.json(data, { status, headers: corsHeaders(origin) });
}

function addCors(res: NextResponse, origin?: string): NextResponse {
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    res.headers.set(k, v);
  }
  return res;
}

function hasApiPermission(permissions: string[], accepted: string[]): boolean {
  if (!permissions || permissions.length === 0) return true;
  return permissions.includes("*") || accepted.some((permission) => permissions.includes(permission));
}

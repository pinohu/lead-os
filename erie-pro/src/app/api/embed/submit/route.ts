// ── Embed Form Submission Endpoint ────────────────────────────────────
// Same logic as /api/leads/inbound but designed for the embeddable widget.
// Always returns CORS headers for cross-origin usage.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { routeLead } from "@/lib/lead-routing";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit-log";
import { deliverWebhookEvent } from "@/lib/webhook-delivery";
import crypto from "crypto";

// ── CORS Preflight ─────────────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

const EmbedLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7).optional(),
  message: z.string().optional(),
  niche: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const rateLimited = await checkRateLimit(req, "lead");
    if (rateLimited) return addCors(rateLimited);

    // Validate API key
    const apiKeyRaw = req.headers.get("x-api-key");
    if (!apiKeyRaw) {
      return corsJson({ success: false, error: "Missing API key" }, 401);
    }

    const keyHash = crypto.createHash("sha256").update(apiKeyRaw).digest("hex");
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { provider: true },
    });

    if (!apiKey || !apiKey.isActive) {
      return corsJson({ success: false, error: "Invalid API key" }, 401);
    }

    // Update lastUsedAt
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body) return corsJson({ success: false, error: "Invalid JSON" }, 400);

    const parsed = EmbedLeadSchema.safeParse(body);
    if (!parsed.success) {
      return corsJson(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        400
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
      return corsJson({ success: false, error: "Contact opted out" }, 403);
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

    return corsJson({
      success: true,
      leadId: result.leadId,
      routedTo: result.routedTo?.businessName ?? "Queued",
    });
  } catch (err) {
    logger.error("api/embed/submit", "Error:", err);
    return corsJson({ success: false, error: "Internal server error" }, 500);
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };
}

function corsJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}

function addCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(corsHeaders())) {
    res.headers.set(k, v);
  }
  return res;
}

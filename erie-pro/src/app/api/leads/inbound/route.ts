// ── Inbound Webhook Endpoint ──────────────────────────────────────────
// Accepts leads from external systems (CRMs, forms, aggregators) via API key auth.
// POST /api/leads/inbound with X-API-Key header.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { routeLead } from "@/lib/lead-routing";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit-log";
import { deliverWebhookEvent } from "@/lib/webhook-delivery";
import { MAX_BODY_SIZE } from "@/lib/validation";
import crypto from "crypto";

// ── CORS Preflight ─────────────────────────────────────────────────
// Server-to-server webhook endpoint — restrict CORS to configured origins.
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const allowed = allowedOrigins.includes(origin);
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key, X-Signature",
      "Vary": "Origin",
    },
  });
}

// ── Inbound Lead Schema ────────────────────────────────────────────
const InboundLeadSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  service: z.string().min(1).optional(),
  niche: z.string().min(1).optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

// ── HMAC Signature Verification ────────────────────────────────────
function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    // 1. Rate limit
    const rateLimited = await checkRateLimit(req, "lead");
    if (rateLimited) return addCors(rateLimited, origin);

    // 1b. Body size check — reject oversized uploads before reading
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return corsJson({ success: false, error: "Request body too large" }, 413);
    }

    // 2. Validate API key from X-API-Key header
    const apiKeyRaw = req.headers.get("x-api-key");
    if (!apiKeyRaw) {
      return corsJson(
        { success: false, error: "Missing X-API-Key header" },
        401
      );
    }

    const keyHash = crypto
      .createHash("sha256")
      .update(apiKeyRaw)
      .digest("hex");
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { provider: true },
    });

    if (!apiKey || !apiKey.isActive) {
      return corsJson(
        { success: false, error: "Invalid or revoked API key" },
        401
      );
    }

    // Update lastUsedAt (fire-and-forget)
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    // 3. Optional HMAC signature verification
    const signature = req.headers.get("x-signature");
    const rawBody = await req.text();

    if (signature) {
      // Find a webhook endpoint secret for this provider to verify against
      const endpoint = await prisma.webhookEndpoint.findFirst({
        where: { providerId: apiKey.providerId, isActive: true },
      });
      if (endpoint) {
        try {
          const valid = verifyHmacSignature(rawBody, signature, endpoint.secret);
          if (!valid) {
            return corsJson(
              { success: false, error: "Invalid HMAC signature" },
              401
            );
          }
        } catch {
          return corsJson(
            { success: false, error: "Invalid HMAC signature format" },
            401
          );
        }
      }
    }

    // 4. Parse and validate body
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return corsJson({ success: false, error: "Invalid JSON" }, 400);
    }

    const parsed = InboundLeadSchema.safeParse(body);
    if (!parsed.success) {
      return corsJson(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join("; "),
        },
        400
      );
    }

    // 5. Map fields
    const data = parsed.data;
    // Niche is pinned to the API key's owning provider. The old logic
    // let the body override it via `data.niche` / `data.service`, which
    // was a cross-tenant injection vector: a malicious provider with a
    // legitimate API key for their own territory could POST with
    // `{niche: "<competitor's niche>"}` and routeLead would route the
    // lead into the competitor's queue — starting the competitor's SLA
    // clock, incrementing pay-per-lead billing, and flooding their
    // dashboard with attacker-crafted spam. The caller gets zero say in
    // which territory a key-authenticated lead lands in.
    const niche = apiKey.provider.niche;
    if (data.niche && data.niche !== niche) {
      logger.warn("api/leads/inbound", "Ignoring caller-supplied niche override", {
        apiKeyId: apiKey.id,
        keyNiche: niche,
        bodyNiche: data.niche,
      });
    }
    const firstName =
      data.firstName || data.name?.split(" ")[0] || "";
    const lastName =
      data.lastName || data.name?.split(" ").slice(1).join(" ") || "";

    // 6. Check suppression list
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

    // 7. Route the lead
    const result = await routeLead(niche, apiKey.provider.city, {
      firstName,
      lastName,
      phone: data.phone || "",
      email: data.email,
      message: data.message,
      source: data.source || "webhook",
      timestamp: new Date().toISOString(),
      tcpaConsent: true,
      tcpaConsentText: "Submitted via provider webhook integration",
      tcpaConsentAt: new Date().toISOString(),
      tcpaIpAddress: "webhook",
    });

    // 8. Audit log
    audit({
      action: "lead.routed",
      entityType: "lead",
      entityId: result.leadId,
      providerId: apiKey.providerId,
      metadata: { niche, source: "webhook", apiKeyId: apiKey.id },
    }).catch(() => {});

    // 9. Deliver outbound webhook events
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
    logger.error("api/leads/inbound", "Error processing inbound lead:", err);
    return corsJson({ success: false, error: "Internal server error" }, 500);
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const allowed = origin ? allowedOrigins.includes(origin) : false;
  return {
    ...(allowed && origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, X-Signature",
    "Vary": "Origin",
  };
}

function corsJson(data: unknown, status = 200, origin?: string | null): NextResponse {
  return NextResponse.json(data, { status, headers: corsHeaders(origin) });
}

function addCors(res: NextResponse, origin?: string | null): NextResponse {
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    res.headers.set(k, v);
  }
  return res;
}

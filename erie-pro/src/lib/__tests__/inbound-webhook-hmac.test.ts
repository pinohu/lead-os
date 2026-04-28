import crypto from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    webhookEndpoint: {
      findFirst: vi.fn(),
    },
    suppression: {
      findFirst: vi.fn(),
    },
  },
  routeLead: vi.fn(),
  checkRateLimit: vi.fn(),
  audit: vi.fn(),
  deliverWebhookEvent: vi.fn(),
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/lead-routing", () => ({
  routeLead: mocks.routeLead,
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.logger,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/audit-log", () => ({
  audit: mocks.audit,
}));

vi.mock("@/lib/webhook-delivery", () => ({
  deliverWebhookEvent: mocks.deliverWebhookEvent,
}));

import { POST } from "@/app/api/leads/inbound/route";
import { encryptWebhookSecret } from "@/lib/webhook-secret";

const ORIGINAL_KEY = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;

function makeInboundRequest(payload: string, signature: string) {
  return new NextRequest("http://localhost:3002/api/leads/inbound", {
    method: "POST",
    headers: {
      "x-api-key": "raw-api-key",
      "x-signature": signature,
      "content-type": "application/json",
    },
    body: payload,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkRateLimit.mockResolvedValue(null);
  mocks.prisma.apiKey.findUnique.mockResolvedValue({
    id: "api_key_1",
    providerId: "provider_1",
    isActive: true,
    provider: {
      niche: "roofing",
      city: "erie",
    },
  });
  mocks.prisma.apiKey.update.mockResolvedValue({});
  mocks.prisma.suppression.findFirst.mockResolvedValue(null);
  mocks.audit.mockResolvedValue(undefined);
  mocks.deliverWebhookEvent.mockResolvedValue(undefined);
  mocks.routeLead.mockResolvedValue({
    leadId: "lead_1",
    routedTo: null,
    routeType: "unmatched",
  });
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  } else {
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

describe("inbound webhook HMAC verification", () => {
  it("decrypts encrypted webhook secrets before verifying", async () => {
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = "test-key-material-for-webhook-secret-encryption";
    const payload = JSON.stringify({ email: "lead@example.com", niche: "roofing" });
    const secret = "whsec_inbound_test";
    const storedSecret = encryptWebhookSecret(secret);
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    mocks.prisma.webhookEndpoint.findFirst.mockResolvedValue({ secret: storedSecret });

    const response = await POST(makeInboundRequest(payload, signature));

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      leadId: "lead_1",
    });
  });

  it("returns 401 instead of throwing for malformed signatures", async () => {
    mocks.prisma.webhookEndpoint.findFirst.mockResolvedValue({ secret: "legacy-secret" });

    const response = await POST(makeInboundRequest(
      JSON.stringify({ email: "lead@example.com", niche: "roofing" }),
      "short",
    ));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "Invalid HMAC signature",
    });
  });
});

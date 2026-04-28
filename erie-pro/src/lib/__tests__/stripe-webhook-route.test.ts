import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    checkoutSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return {
    tx,
    prisma: {
      $transaction: vi.fn(),
      auditLog: { findFirst: vi.fn() },
      checkoutSession: { updateMany: vi.fn() },
      provider: {
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      territory: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      lead: {
        updateMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      directoryListing: {
        findUnique: vi.fn(),
      },
    },
    getCheckoutSession: vi.fn(),
    isStripeDryRun: vi.fn(),
    handleStripeWebhook: vi.fn(),
    audit: vi.fn(),
    sendEmail: vi.fn(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock("@/lib/stripe-integration", () => ({
  constructWebhookEvent: vi.fn(),
  handleStripeWebhook: mocks.handleStripeWebhook,
  isStripeDryRun: mocks.isStripeDryRun,
  getCheckoutSession: mocks.getCheckoutSession,
  getMonthlyFee: vi.fn(() => 400),
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/city-config", () => ({
  cityConfig: {
    domain: "erie.test",
    name: "Erie",
    slug: "erie",
  },
}));

vi.mock("@/lib/perk-manager", () => ({
  activatePerks: vi.fn(),
  deactivatePerks: vi.fn(),
}));

vi.mock("@/lib/lead-routing", () => ({
  deliverBankedLeads: vi.fn(),
}));

vi.mock("@/lib/audit-log", () => ({
  audit: mocks.audit,
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.logger,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
  sendWelcomeEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendClaimVerificationCode: vi.fn(),
  sendAdminVerificationAlert: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/stripe/route";

const checkoutSession = {
  id: "checkout_1",
  sessionType: "lead_purchase",
  stripeSessionId: "cs_lead_123",
  niche: "roofing",
  city: "erie",
  providerEmail: "buyer@example.com",
  providerName: null,
  providerId: null,
  monthlyFee: null,
  status: "pending",
  leadId: "lead_1",
  temperature: "hot",
  price: 100,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  expiresAt: null,
  completedAt: null,
  assignedProviderId: null,
  opsNotes: null,
  fulfilledAt: null,
  renewalReminder30SentAt: null,
  renewalReminder7SentAt: null,
  expiredAt: null,
};

const lead = {
  id: "lead_1",
  niche: "roofing",
  city: "erie",
  firstName: "Pat",
  lastName: "Buyer",
  email: "lead@example.com",
  phone: "8145550101",
  message: "Need a roof estimate",
  source: "erie-pro",
  temperature: "hot",
  createdAt: new Date("2026-04-02T00:00:00.000Z"),
};

function stripeDryRunRequest() {
  return new NextRequest("http://localhost:3002/api/webhooks/stripe", {
    method: "POST",
    body: JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_lead_123" } },
    }),
  });
}

describe("Stripe webhook lead purchase fulfillment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isStripeDryRun.mockReturnValue(true);
    mocks.getCheckoutSession.mockResolvedValue(checkoutSession);
    mocks.prisma.$transaction.mockImplementation(async (callback) => callback(mocks.tx));
    mocks.tx.checkoutSession.findUnique.mockResolvedValue(checkoutSession);
    mocks.tx.lead.findUnique.mockResolvedValue(lead);
    mocks.tx.lead.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.checkoutSession.update.mockResolvedValue({
      ...checkoutSession,
      status: "completed",
      completedAt: new Date(),
    });
    mocks.audit.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue(true);
  });

  it("fulfills lead_purchase sessions and sends purchased lead details", async () => {
    const response = await POST(stripeDryRunRequest());

    await expect(response.json()).resolves.toMatchObject({
      received: true,
      mode: "dry-run",
      type: "checkout.session.completed",
    });
    expect(mocks.tx.lead.updateMany).toHaveBeenCalledWith({
      where: { id: "lead_1", routeType: "unmatched" },
      data: {
        routeType: "overflow",
        routedToId: null,
        slaDeadline: null,
        deliverAt: null,
      },
    });
    expect(mocks.tx.checkoutSession.update).toHaveBeenCalledWith({
      where: { id: "checkout_1" },
      data: { status: "completed", completedAt: expect.any(Date) },
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "buyer@example.com",
      html: expect.stringContaining("lead@example.com"),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      action: "lead.purchased",
      entityType: "lead",
      entityId: "lead_1",
    }));
  });

  it("skips side effects when the checkout session is already completed", async () => {
    mocks.tx.checkoutSession.findUnique.mockResolvedValue({
      ...checkoutSession,
      status: "completed",
    });

    const response = await POST(stripeDryRunRequest());

    expect(response.status).toBe(200);
    expect(mocks.tx.lead.updateMany).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});

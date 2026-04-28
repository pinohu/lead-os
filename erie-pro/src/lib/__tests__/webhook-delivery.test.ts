import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  decryptWebhookSecret: vi.fn((secret: string) => secret),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("dns/promises", () => ({
  lookup: mocks.lookup,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    webhookEndpoint: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.logger,
}));

vi.mock("@/lib/webhook-secret", () => ({
  decryptWebhookSecret: mocks.decryptWebhookSecret,
}));

import { sendTestWebhook, validateWebhookUrl } from "@/lib/webhook-delivery";

describe("validateWebhookUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-HTTPS webhook URLs", async () => {
    await expect(validateWebhookUrl("http://example.com/hook")).resolves.toMatchObject({
      valid: false,
      error: "Webhook URL must use HTTPS",
    });
  });

  it("rejects literal private IP targets without DNS lookup", async () => {
    await expect(validateWebhookUrl("https://127.0.0.1/hook")).resolves.toMatchObject({
      valid: false,
    });
    expect(mocks.lookup).not.toHaveBeenCalled();
  });

  it("rejects hostnames that resolve to private IP addresses", async () => {
    mocks.lookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);

    await expect(validateWebhookUrl("https://example.com/hook")).resolves.toMatchObject({
      valid: false,
      error: "Webhook URL must resolve only to public IP addresses",
    });
  });

  it("allows HTTPS hostnames that resolve only to public IP addresses", async () => {
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    await expect(validateWebhookUrl("https://example.com/hook")).resolves.toEqual({
      valid: true,
    });
  });
});

describe("sendTestWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses manual redirect mode for outbound webhook fetches", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    mocks.findUnique.mockResolvedValue({
      id: "endpoint_1",
      url: "https://example.com/hook",
      secret: "whsec_test",
    });

    await expect(sendTestWebhook("endpoint_1")).resolves.toEqual({
      success: true,
      status: 204,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });
});

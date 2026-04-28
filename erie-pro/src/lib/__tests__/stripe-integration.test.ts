import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/city-config", () => ({
  cityConfig: {
    domain: "erie.test",
    name: "Erie",
    slug: "erie",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("stripe integration production configuration", () => {
  it("requires STRIPE_WEBHOOK_SECRET when live Stripe is enabled in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.stubEnv("STRIPE_SIGNING_SECRET", "");
    vi.stubEnv("STRIPE_SIIGNING_SECRET", "");

    await expect(import("@/lib/stripe-integration")).rejects.toThrow(
      /STRIPE_WEBHOOK_SECRET is required/,
    );
  });
});

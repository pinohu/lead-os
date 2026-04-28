import { afterEach, describe, expect, it } from "vitest";
import {
  applyEnvAliases,
  getAuthSecret,
  getStripePublishableKey,
  getStripeWebhookSecret,
} from "@/lib/env-aliases";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env aliases", () => {
  it("uses canonical values before aliases", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_canonical";
    process.env.STRIPE_SIIGNING_SECRET = "whsec_alias";

    expect(getStripeWebhookSecret()).toBe("whsec_canonical");
  });

  it("accepts the existing misspelled Stripe signing secret alias", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SIIGNING_SECRET = "whsec_alias";

    expect(getStripeWebhookSecret()).toBe("whsec_alias");
  });

  it("accepts the existing publishable key alias", () => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    process.env.STRIPE_PUBLISHABLE_KEY = "pk_live_alias";

    expect(getStripePublishableKey()).toBe("pk_live_alias");
  });

  it("accepts NEXTAUTH_SECRET as an AUTH_SECRET alias", () => {
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "legacy-auth-secret";

    expect(getAuthSecret()).toBe("legacy-auth-secret");
  });

  it("copies aliases into canonical process env names", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SIIGNING_SECRET = "whsec_alias";

    applyEnvAliases();

    expect(process.env.STRIPE_WEBHOOK_SECRET).toBe("whsec_alias");
  });
});

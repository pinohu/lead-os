import { describe, it, expect, vi, afterEach } from "vitest";
import { isFeatureEnabled, getAllFlags, getABVariant } from "../feature-flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isFeatureEnabled", () => {
  it("returns false for flags that default to false", () => {
    expect(isFeatureEnabled("email_notifications")).toBe(false);
    expect(isFeatureEnabled("stripe_live")).toBe(false);
    expect(isFeatureEnabled("ab_new_claim_form")).toBe(false);
  });

  it("returns true when env var is set to 'true'", () => {
    vi.stubEnv("FEATURE_EMAIL_NOTIFICATIONS", "true");
    expect(isFeatureEnabled("email_notifications")).toBe(true);
  });

  it("returns true when env var is set to '1'", () => {
    vi.stubEnv("FEATURE_STRIPE_LIVE", "1");
    expect(isFeatureEnabled("stripe_live")).toBe(true);
  });

  it("returns false when env var is set to 'false'", () => {
    vi.stubEnv("FEATURE_EMAIL_NOTIFICATIONS", "false");
    expect(isFeatureEnabled("email_notifications")).toBe(false);
  });

  it("returns false when env var is empty string", () => {
    vi.stubEnv("FEATURE_EMAIL_NOTIFICATIONS", "");
    expect(isFeatureEnabled("email_notifications")).toBe(false);
  });
});

describe("getAllFlags", () => {
  it("returns all 14 flags", () => {
    const flags = getAllFlags();
    const keys = Object.keys(flags);
    expect(keys.length).toBe(14);
    expect(keys).toContain("email_notifications");
    expect(keys).toContain("ab_new_claim_form");
    expect(keys).toContain("multi_city");
  });

  it("includes enabled state, description, and phase for each flag", () => {
    const flags = getAllFlags();
    for (const value of Object.values(flags)) {
      expect(typeof value.enabled).toBe("boolean");
      expect(typeof value.description).toBe("string");
      expect(typeof value.phase).toBe("number");
    }
  });
});

describe("getABVariant", () => {
  it("returns 'control' or 'variant'", () => {
    const result = getABVariant("test_experiment", "user-123");
    expect(["control", "variant"]).toContain(result);
  });

  it("is deterministic for the same test+user", () => {
    const a = getABVariant("exp1", "user-abc");
    const b = getABVariant("exp1", "user-abc");
    expect(a).toBe(b);
  });

  it("varies by user", () => {
    // With enough users, we should see both variants.
    const variants = new Set<string>();
    for (let i = 0; i < 100; i++) {
      variants.add(getABVariant("exp1", `user-${i}`));
    }
    expect(variants.size).toBe(2);
  });

  it("varies by test name", () => {
    const variants = new Set<string>();
    for (let i = 0; i < 100; i++) {
      variants.add(getABVariant(`test-${i}`, "user-fixed"));
    }
    expect(variants.size).toBe(2);
  });

  it("respects split percentage", () => {
    // 100% split means everyone is variant
    const result = getABVariant("test", "user", 0);
    expect(result).toBe("variant");
  });
});

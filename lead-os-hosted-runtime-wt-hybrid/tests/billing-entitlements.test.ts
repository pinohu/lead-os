// tests/billing-entitlements.test.ts
import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

describe("billing entitlements", () => {
  let prev: string | undefined;

  beforeEach(() => {
    prev = process.env.LEAD_OS_BILLING_ENFORCE;
    delete process.env.LEAD_OS_BILLING_ENFORCE;
  });

  afterEach(() => {
    if (prev !== undefined) process.env.LEAD_OS_BILLING_ENFORCE = prev;
    else delete process.env.LEAD_OS_BILLING_ENFORCE;
  });

  it("assertPricingExecutionAllowed passes when enforcement is off", async () => {
    const { assertPricingExecutionAllowed } = await import("../src/lib/billing/entitlements");
    const r = await assertPricingExecutionAllowed("any-tenant-id");
    assert.equal(r.allowed, true);
    assert.equal(r.state.enforcement, false);
  });
});

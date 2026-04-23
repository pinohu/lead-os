// tests/api-route-tier.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRequiredApiAccessTier } from "../src/lib/billing/api-route-tier";

describe("getRequiredApiAccessTier", () => {
  it("requires full tier for operator APIs", () => {
    assert.equal(getRequiredApiAccessTier("/api/operator/actions", "POST"), "full");
    assert.equal(getRequiredApiAccessTier("/api/operator/gtm", "GET"), "full");
  });

  it("requires standard tier for other APIs", () => {
    assert.equal(getRequiredApiAccessTier("/api/leads", "GET"), "standard");
  });
});

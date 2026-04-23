// tests/gtm-operator-api.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRequiredApiAccessTier } from "../src/lib/billing/api-route-tier.ts";
import { GtmStatusPatchSchema } from "../src/lib/gtm/patch-schema.ts";
import { resolveGtmCanonicalSlug } from "../src/config/gtm-use-cases.ts";

describe("GTM operator API contracts", () => {
  it("requires full API tier for operator GTM routes", () => {
    assert.equal(getRequiredApiAccessTier("/api/operator/gtm", "GET"), "full");
    assert.equal(getRequiredApiAccessTier("/api/operator/gtm", "PATCH"), "full");
  });

  it("rejects empty patch body", () => {
    const r = GtmStatusPatchSchema.safeParse({ slug: "erie-exclusive-niche" });
    assert.equal(r.success, false);
  });

  it("accepts status-only patch", () => {
    const r = GtmStatusPatchSchema.safeParse({ slug: "erie-exclusive-niche", status: "in_progress" });
    assert.equal(r.success, true);
  });

  it("accepts notes-only patch", () => {
    const r = GtmStatusPatchSchema.safeParse({ slug: "erie-plumbing", notes: "pilot week 1" });
    assert.equal(r.success, true);
    if (r.success) assert.equal(resolveGtmCanonicalSlug(r.data.slug), "erie-exclusive-niche");
  });

  it("rejects invalid status enum", () => {
    const r = GtmStatusPatchSchema.safeParse({
      slug: "erie-exclusive-niche",
      status: "done",
    });
    assert.equal(r.success, false);
  });
});

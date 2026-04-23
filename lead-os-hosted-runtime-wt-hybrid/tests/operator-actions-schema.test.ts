// tests/operator-actions-schema.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OperatorActionSchema } from "../src/lib/operator-actions";

describe("OperatorActionSchema", () => {
  it("accepts dlq_replay with numeric id", () => {
    const r = OperatorActionSchema.safeParse({ type: "dlq_replay", deadLetterId: "12" });
    assert.equal(r.success, true);
  });

  it("rejects invalid dead letter id", () => {
    const r = OperatorActionSchema.safeParse({ type: "dlq_replay", deadLetterId: "abc" });
    assert.equal(r.success, false);
  });

  it("accepts pricing_override force_apply", () => {
    const r = OperatorActionSchema.safeParse({
      type: "pricing_override",
      recommendationId: "99",
      decision: "force_apply",
    });
    assert.equal(r.success, true);
  });
});

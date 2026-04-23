// tests/idempotency-hash.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPayloadJson } from "../src/lib/idempotency";

describe("hashPayloadJson", () => {
  it("is stable for equivalent payloads", () => {
    const a = hashPayloadJson({ type: "node_pause", nodeKey: "x" });
    const b = hashPayloadJson({ type: "node_pause", nodeKey: "x" });
    assert.equal(a, b);
  });

  it("changes when payload changes", () => {
    const a = hashPayloadJson({ type: "node_pause", nodeKey: "a" });
    const b = hashPayloadJson({ type: "node_pause", nodeKey: "b" });
    assert.notEqual(a, b);
  });
});

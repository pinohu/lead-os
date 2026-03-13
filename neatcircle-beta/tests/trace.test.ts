import test from "node:test";
import assert from "node:assert/strict";
import { buildLeadKey, normalizePhoneKey, parseStructuredDetail } from "../src/lib/trace.ts";

test("buildLeadKey prefers normalized email and falls back to normalized phone", () => {
  assert.equal(buildLeadKey(" Ops@Example.com "), "email:ops@example.com");
  assert.equal(buildLeadKey(undefined, "+1 (555) 333-1212"), "phone:15553331212");
  assert.equal(buildLeadKey(undefined, undefined), undefined);
});

test("normalizePhoneKey strips non-digits", () => {
  assert.equal(normalizePhoneKey("+1 (555) 333-1212"), "15553331212");
});

test("parseStructuredDetail returns object payloads and ignores invalid JSON", () => {
  assert.deepEqual(parseStructuredDetail('{"kind":"event","trace":{"visitorId":"v_1"}}'), {
    kind: "event",
    trace: { visitorId: "v_1" },
  });
  assert.equal(parseStructuredDetail("not-json"), null);
});

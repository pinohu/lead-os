import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { requireOperatorApiSession } from "../src/lib/operator-auth.ts";

const ORIGINAL_AUTH_SECRET = process.env.LEAD_OS_AUTH_SECRET;

afterEach(() => {
  if (ORIGINAL_AUTH_SECRET === undefined) delete process.env.LEAD_OS_AUTH_SECRET;
  else process.env.LEAD_OS_AUTH_SECRET = ORIGINAL_AUTH_SECRET;
});

function signedOperatorRequest(method = "operator-cookie") {
  process.env.LEAD_OS_AUTH_SECRET = "test-auth-secret";
  const userId = "operator@example.com";
  const tenantId = "default";
  const requestId = "req_operator_test";
  const signature = createHmac("sha256", process.env.LEAD_OS_AUTH_SECRET)
    .update(`${userId}:${tenantId}:${requestId}`)
    .digest("hex");

  return new Request("https://lead-os.test/api/operator/actions", {
    headers: {
      "x-authenticated-user-id": userId,
      "x-authenticated-tenant-id": tenantId,
      "x-authenticated-method": method,
      "x-request-id": requestId,
      "x-middleware-signature": signature,
    },
  });
}

describe("requireOperatorApiSession", () => {
  it("accepts signed operator-cookie middleware identity", async () => {
    const result = await requireOperatorApiSession(signedOperatorRequest());
    assert.equal(result.response, null);
    assert.equal(result.session?.email, "operator@example.com");
  });

  it("rejects signed non-operator middleware identity", async () => {
    const result = await requireOperatorApiSession(signedOperatorRequest("api-key"));
    assert.equal(result.session, null);
    assert.equal(result.response?.status, 401);
  });

  it("rejects spoofed operator headers without middleware signature", async () => {
    process.env.LEAD_OS_AUTH_SECRET = "test-auth-secret";
    const result = await requireOperatorApiSession(new Request("https://lead-os.test/api/operator/actions", {
      headers: {
        "x-authenticated-user-id": "operator@example.com",
        "x-authenticated-method": "operator-cookie",
      },
    }));
    assert.equal(result.session, null);
    assert.equal(result.response?.status, 401);
  });
});

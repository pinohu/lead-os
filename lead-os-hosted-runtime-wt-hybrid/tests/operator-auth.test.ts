import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import { getSignedOperatorSessionFromHeaders } from "../src/lib/operator-session-headers.ts";
import { getOperatorAuthSecret } from "../src/lib/operator-auth-secret.ts";

function signedOperatorHeaders(secret: string, userId = "operator@example.com") {
  const tenantId = "tenant-1";
  const requestId = "req-1";
  const signature = createHmac("sha256", secret)
    .update(`${userId}:${tenantId}:${requestId}`)
    .digest("hex");

  return {
    "x-authenticated-user-id": userId,
    "x-authenticated-role": "owner",
    "x-authenticated-tenant-id": tenantId,
    "x-authenticated-method": "operator-cookie",
    "x-request-id": requestId,
    "x-middleware-signature": signature,
  };
}

test("operator API session rejects spoofed unsigned middleware identity headers", async () => {
  process.env.LEAD_OS_AUTH_SECRET = "test-middleware-secret";
  const headers = new Headers({
      "x-authenticated-user-id": "attacker@example.com",
      "x-authenticated-method": "operator-cookie",
  });

  const session = getSignedOperatorSessionFromHeaders(headers);

  assert.equal(session, null);
});

test("operator API session accepts signed middleware identity headers", async () => {
  process.env.LEAD_OS_AUTH_SECRET = "test-middleware-secret";
  const headers = new Headers(signedOperatorHeaders(process.env.LEAD_OS_AUTH_SECRET));

  const session = getSignedOperatorSessionFromHeaders(headers);

  assert.equal(session?.email, "operator@example.com");
});

test("operator API session rejects signed identity when x-request-id is not forwarded", async () => {
  process.env.LEAD_OS_AUTH_SECRET = "test-middleware-secret";
  const headers = new Headers(signedOperatorHeaders(process.env.LEAD_OS_AUTH_SECRET));
  headers.delete("x-request-id");

  const session = getSignedOperatorSessionFromHeaders(headers);

  assert.equal(session, null);
});

test("operator auth secret resolution fails closed when auth secret is missing", () => {
  const previousSecret = process.env.LEAD_OS_AUTH_SECRET;
  delete process.env.LEAD_OS_AUTH_SECRET;

  try {
    assert.throws(
      () => getOperatorAuthSecret(),
      /LEAD_OS_AUTH_SECRET is required/,
    );
  } finally {
    if (previousSecret) {
      process.env.LEAD_OS_AUTH_SECRET = previousSecret;
    } else {
      delete process.env.LEAD_OS_AUTH_SECRET;
    }
  }
});

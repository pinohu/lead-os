import test from "node:test";
import assert from "node:assert/strict";
import {
  DASHBOARD_AUTH_COOKIE,
  hasAuthorizationSecret,
  hasSharedSecretAuth,
} from "../src/lib/admin-auth.ts";

function basicAuth(password: string) {
  return `Basic ${Buffer.from(`admin:${password}`).toString("base64")}`;
}

test("shared secret auth accepts bearer, basic password, and configured cookies", () => {
  const secret = "test-secret";

  assert.equal(
    hasAuthorizationSecret(new Headers({ authorization: `Bearer ${secret}` }), secret),
    true,
  );
  assert.equal(
    hasAuthorizationSecret(new Headers({ authorization: basicAuth(secret) }), secret),
    true,
  );
  assert.equal(
    hasSharedSecretAuth(
      new Headers({ cookie: `${DASHBOARD_AUTH_COOKIE}=${encodeURIComponent(secret)}` }),
      secret,
      { cookieNames: [DASHBOARD_AUTH_COOKIE] },
    ),
    true,
  );
});

test("same-origin-looking browser headers do not authenticate without a real secret", () => {
  const browserHeaders = new Headers({
    origin: "https://lead-os.example",
    referer: "https://lead-os.example/dashboard",
    "sec-fetch-site": "same-origin",
  });

  assert.equal(
    hasSharedSecretAuth(browserHeaders, "test-secret", { cookieNames: [DASHBOARD_AUTH_COOKIE] }),
    false,
  );
});

test("automation auth can disable basic credentials", () => {
  const secret = "automation-secret";

  assert.equal(
    hasSharedSecretAuth(new Headers({ authorization: basicAuth(secret) }), secret, { allowBasic: false }),
    false,
  );
  assert.equal(
    hasSharedSecretAuth(new Headers({ authorization: `Bearer ${secret}` }), secret, { allowBasic: false }),
    true,
  );
});

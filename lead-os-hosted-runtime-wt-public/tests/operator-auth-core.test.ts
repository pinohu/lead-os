import test from "node:test";
import assert from "node:assert/strict";
import {
  createMagicLinkUrl,
  decodeOperatorToken,
  getAllowedOperatorEmails,
  resolveTrustedAuthRequest,
  sanitizeNextPath,
} from "../src/lib/operator-auth-core.ts";

test("sanitizeNextPath only allows internal paths", () => {
  assert.equal(sanitizeNextPath("/dashboard"), "/dashboard");
  assert.equal(sanitizeNextPath("//evil.example.com"), "/dashboard");
  assert.equal(sanitizeNextPath("https://evil.example.com"), "/dashboard");
  assert.equal(sanitizeNextPath(undefined), "/dashboard");
});

test("getAllowedOperatorEmails prefers configured operator emails", () => {
  const allowed = getAllowedOperatorEmails(" Ops@Example.org ; owner@example.org,invalid ");

  assert.deepEqual(allowed, ["ops@example.org", "owner@example.org"]);
});

test("getAllowedOperatorEmails does not fall back when no operator emails are configured", () => {
  const allowed = getAllowedOperatorEmails("");

  assert.deepEqual(allowed, []);
});

test("auth requests must use the canonical site origin except for local loopback", () => {
  const trusted = resolveTrustedAuthRequest(
    "https://leados.yourdeputy.com/api/auth/request-link",
    "https://leados.yourdeputy.com",
  );
  const rejected = resolveTrustedAuthRequest(
    "https://evil.example.com/api/auth/request-link",
    "https://leados.yourdeputy.com",
  );
  const local = resolveTrustedAuthRequest(
    "http://127.0.0.1:3001/api/auth/request-link",
    "http://localhost:3000",
  );

  assert.equal(trusted.trusted, true);
  assert.equal(trusted.tokenAudience, "https://leados.yourdeputy.com");
  assert.equal(rejected.trusted, false);
  assert.equal(local.trusted, true);
  assert.equal(local.tokenAudience, "http://localhost:3000");
});

test("magic-link tokens validate for approved emails and retain next path", async () => {
  const secret = "operator-secret";
  const allowedEmails = ["polycarpohu@gmail.com"];
  const { token, url } = await createMagicLinkUrl(
    "PolycarpOhu@gmail.com",
    "https://leados.yourdeputy.com",
    secret,
    allowedEmails,
    "/dashboard",
  );

  assert.match(url, /\/auth\/verify\?/);
  assert.equal(new URL(url).origin, "https://leados.yourdeputy.com");
  const payload = await decodeOperatorToken(token, "magic", secret, allowedEmails, "https://leados.yourdeputy.com");

  assert.ok(payload);
  assert.equal(payload?.email, "polycarpohu@gmail.com");
  assert.equal(payload?.aud, "https://leados.yourdeputy.com");
  assert.equal(payload?.next, "/dashboard");
});

test("magic-link tokens fail validation for the wrong audience", async () => {
  const secret = "operator-secret";
  const allowedEmails = ["polycarpohu@gmail.com"];
  const { token } = await createMagicLinkUrl(
    "polycarpohu@gmail.com",
    "https://leados.yourdeputy.com",
    secret,
    allowedEmails,
    "/dashboard",
  );

  const payload = await decodeOperatorToken(token, "magic", secret, allowedEmails, "https://evil.example.com");
  assert.equal(payload, null);
});

test("tokens fail validation when signed email is no longer approved", async () => {
  const secret = "operator-secret";
  const { token } = await createMagicLinkUrl(
    "polycarpohu@gmail.com",
    "https://leados.yourdeputy.com",
    secret,
    ["polycarpohu@gmail.com"],
    "/dashboard",
  );

  const payload = await decodeOperatorToken(token, "magic", secret, ["someoneelse@example.org"]);
  assert.equal(payload, null);
});

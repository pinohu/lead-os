import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign, type JsonWebKey, type KeyObject } from "crypto";
import {
  parseIdToken,
  parseSamlResponse,
  type OidcConfig,
  type SamlConfig,
} from "../src/lib/sso.ts";

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");
}

function createSignedIdToken(
  privateKey: KeyObject,
  payload: Record<string, unknown>,
): string {
  const header = base64urlJson({ alg: "RS256", kid: "kid-1", typ: "JWT" });
  const body = base64urlJson(payload);
  const signingInput = `${header}.${body}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

async function withMockJwks(jwk: JsonWebKey, fn: () => Promise<void>): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ keys: [jwk] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })) as typeof fetch;

  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function oidcConfig(): OidcConfig {
  return {
    clientId: "client-1",
    clientSecret: "secret",
    issuerUrl: "https://idp.example.com",
    callbackUrl: "https://app.example.com/api/auth/sso/oidc/callback",
    scopes: ["openid", "email", "profile"],
    jwksUrl: "https://idp.example.com/.well-known/jwks.json",
  };
}

test("parseIdToken verifies JWKS signature, issuer, audience, and nonce", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey & { kid?: string; use?: string };
  jwk.kid = "kid-1";
  jwk.alg = "RS256";
  jwk.use = "sig";

  const token = createSignedIdToken(privateKey, {
    iss: "https://idp.example.com",
    aud: "client-1",
    nonce: "nonce-1",
    exp: Math.floor(Date.now() / 1000) + 300,
    sub: "user-1",
    email: "sso@example.com",
    name: "SSO User",
  });

  await withMockJwks(jwk, async () => {
    const user = await parseIdToken(token, { config: oidcConfig(), expectedNonce: "nonce-1" });
    assert.equal(user.email, "sso@example.com");
    assert.equal(user.provider, "oidc");
  });
});

test("parseIdToken fails closed without verification options", async () => {
  await assert.rejects(
    () => parseIdToken("a.b.c"),
    /verification options are required/,
  );
});

test("parseIdToken rejects nonce mismatches after signature verification", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey & { kid?: string; use?: string };
  jwk.kid = "kid-1";
  jwk.alg = "RS256";
  jwk.use = "sig";

  const token = createSignedIdToken(privateKey, {
    iss: "https://idp.example.com",
    aud: "client-1",
    nonce: "nonce-1",
    exp: Math.floor(Date.now() / 1000) + 300,
    sub: "user-1",
    email: "sso@example.com",
  });

  await withMockJwks(jwk, async () => {
    await assert.rejects(
      () => parseIdToken(token, { config: oidcConfig(), expectedNonce: "wrong-nonce" }),
      /nonce verification failed/,
    );
  });
});

test("parseSamlResponse fails closed until XML signature verification is implemented", () => {
  const config: SamlConfig = {
    entityId: "https://app.example.com",
    assertionConsumerServiceUrl: "https://app.example.com/api/auth/sso/saml/callback",
    idpMetadataUrl: "",
    idpSsoUrl: "https://idp.example.com/saml",
    idpCertificate: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----",
  };
  const xml = [
    "<samlp:Response>",
    "<ds:Signature>placeholder</ds:Signature>",
    "<saml:NameID>sso@example.com</saml:NameID>",
    "</samlp:Response>",
  ].join("");

  const user = parseSamlResponse(Buffer.from(xml, "utf-8").toString("base64"), config);

  assert.equal(user, null);
});

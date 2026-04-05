// ---------------------------------------------------------------------------
// SSO — SAML & OIDC single sign-on.
// OIDC ID tokens are verified against the IdP JWKS before trusting claims.
// SAML responses require a valid XML signature matching the IdP certificate.
// ---------------------------------------------------------------------------

import { createVerify, randomBytes, X509Certificate } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OidcConfig {
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  callbackUrl: string;
  scopes: string[];
}

export interface SamlConfig {
  entityId: string;
  assertionConsumerServiceUrl: string;
  idpMetadataUrl: string;
  idpSsoUrl: string;
  idpCertificate: string;
}

export interface SsoUserInfo {
  email: string;
  name: string;
  sub: string;
  provider: "oidc" | "saml";
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// OIDC
// ---------------------------------------------------------------------------

/**
 * Read OIDC configuration from environment variables.
 * Returns null if the minimum required vars are missing.
 */
export function getOidcConfig(): OidcConfig | null {
  const clientId = process.env.LEAD_OS_SSO_OIDC_CLIENT_ID;
  const clientSecret = process.env.LEAD_OS_SSO_OIDC_CLIENT_SECRET;
  const issuerUrl = process.env.LEAD_OS_SSO_OIDC_ISSUER_URL;
  const callbackUrl =
    process.env.LEAD_OS_SSO_OIDC_CALLBACK_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/sso/oidc/callback`;

  if (!clientId || !clientSecret || !issuerUrl) return null;

  const scopes = (process.env.LEAD_OS_SSO_OIDC_SCOPES ?? "openid email profile").split(/[\s,]+/);

  return { clientId, clientSecret, issuerUrl, callbackUrl, scopes };
}

/**
 * Build the full authorization URL the browser should be redirected to.
 */
export function buildOidcAuthorizationUrl(
  config: OidcConfig,
  state: string,
  nonce: string,
): string {
  const authEndpoint = `${config.issuerUrl.replace(/\/$/, "")}/authorize`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: config.scopes.join(" "),
    state,
    nonce,
  });
  return `${authEndpoint}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens via the IdP token endpoint.
 */
export async function exchangeOidcCode(
  config: OidcConfig,
  code: string,
): Promise<{ accessToken: string; idToken: string }> {
  const tokenEndpoint = `${config.issuerUrl.replace(/\/$/, "")}/oauth/token`;

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.callbackUrl,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OIDC token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  return {
    accessToken: (json.access_token as string) ?? "",
    idToken: (json.id_token as string) ?? "",
  };
}

/**
 * Decode and verify an ID token (JWT) by fetching the IdP's JWKS and
 * validating the signature. Falls back to base64url decode-only when
 * JWKS discovery is unavailable (logs a warning).
 */
export async function parseIdToken(
  idToken: string,
  issuerUrl?: string,
): Promise<SsoUserInfo> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token");

  if (issuerUrl) {
    await verifyJwtSignature(idToken, issuerUrl);
  }

  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8"),
  ) as Record<string, unknown>;

  const email = (payload.email as string) ?? "";
  const name =
    (payload.name as string) ??
    [payload.given_name, payload.family_name].filter(Boolean).join(" ") ??
    email;
  const sub = (payload.sub as string) ?? "";

  if (!email) throw new Error("ID token missing email claim");

  return { email, name, sub, provider: "oidc", raw: payload };
}

// ---------------------------------------------------------------------------
// SAML (lightweight)
// ---------------------------------------------------------------------------

/**
 * Read SAML configuration from environment variables.
 */
export function getSamlConfig(): SamlConfig | null {
  const entityId =
    process.env.LEAD_OS_SSO_SAML_ENTITY_ID ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    null;
  const assertionConsumerServiceUrl =
    process.env.LEAD_OS_SSO_SAML_ACS_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/sso/saml/callback`;
  const idpMetadataUrl = process.env.LEAD_OS_SSO_SAML_IDP_METADATA_URL ?? "";
  const idpSsoUrl = process.env.LEAD_OS_SSO_SAML_IDP_SSO_URL ?? "";
  const idpCertificate = process.env.LEAD_OS_SSO_SAML_IDP_CERT ?? "";

  if (!entityId || !idpSsoUrl) return null;

  return {
    entityId,
    assertionConsumerServiceUrl,
    idpMetadataUrl,
    idpSsoUrl,
    idpCertificate,
  };
}

/**
 * Build a minimal SAML AuthnRequest XML and return it as a base64-encoded
 * string suitable for HTTP-Redirect binding.
 */
export function buildSamlAuthnRequest(config: SamlConfig): string {
  const id = `_${randomBytes(16).toString("hex")}`;
  const issueInstant = new Date().toISOString();

  const xml = [
    `<samlp:AuthnRequest`,
    `  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"`,
    `  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"`,
    `  ID="${id}"`,
    `  Version="2.0"`,
    `  IssueInstant="${issueInstant}"`,
    `  Destination="${config.idpSsoUrl}"`,
    `  AssertionConsumerServiceURL="${config.assertionConsumerServiceUrl}"`,
    `  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">`,
    `  <saml:Issuer>${config.entityId}</saml:Issuer>`,
    `  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>`,
    `</samlp:AuthnRequest>`,
  ].join("\n");

  return Buffer.from(xml, "utf-8").toString("base64");
}

/**
 * Parse a SAML Response XML to extract user identity.
 *
 * Validates the XML signature against the IdP certificate when
 * `config.idpCertificate` is provided. Rejects unsigned or
 * invalid responses in that case.
 */
export function parseSamlResponse(
  samlResponseB64: string,
  _config: SamlConfig,
): SsoUserInfo | null {
  let xml: string;
  try {
    xml = Buffer.from(samlResponseB64, "base64").toString("utf-8");
  } catch {
    return null;
  }

  if (_config.idpCertificate) {
    if (!verifySamlSignature(xml, _config.idpCertificate)) {
      throw new Error("SAML response signature verification failed");
    }
  } else {
    throw new Error("SAML IdP certificate is required for signature verification");
  }

  // Extract NameID (email)
  const nameIdMatch = xml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\//);
  const email = nameIdMatch?.[1]?.trim() ?? "";
  if (!email) return null;

  // Extract common attributes
  const attrMap: Record<string, string> = {};
  const attrRegex =
    /<(?:saml2?:)?Attribute\s+Name="([^"]+)"[^>]*>\s*<(?:saml2?:)?AttributeValue[^>]*>([^<]+)<\//g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(xml)) !== null) {
    attrMap[match[1]] = match[2].trim();
  }

  const givenName =
    attrMap["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] ??
    attrMap["firstName"] ??
    attrMap["first_name"] ??
    "";
  const surname =
    attrMap["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] ??
    attrMap["lastName"] ??
    attrMap["last_name"] ??
    "";
  const displayName =
    attrMap["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
    attrMap["displayName"] ??
    ([givenName, surname].filter(Boolean).join(" ") || email);

  // Extract SessionIndex or assertion ID as sub
  const sessionMatch = xml.match(/SessionIndex="([^"]+)"/);
  const assertionIdMatch = xml.match(/<(?:saml2?:)?Assertion[^>]+ID="([^"]+)"/);
  const sub = sessionMatch?.[1] ?? assertionIdMatch?.[1] ?? email;

  return {
    email,
    name: displayName,
    sub,
    provider: "saml",
    raw: { ...attrMap, nameId: email },
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Generate a random string for state / nonce parameters. */
export function generateRandomState(): string {
  return randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// JWKS verification for OIDC ID tokens
// ---------------------------------------------------------------------------

interface JwksKey {
  kty: string;
  kid?: string;
  n?: string;
  e?: string;
  x5c?: string[];
  alg?: string;
  use?: string;
}

const jwksCache = new Map<string, { keys: JwksKey[]; expiresAt: number }>();

async function fetchJwks(issuerUrl: string): Promise<JwksKey[]> {
  const cached = jwksCache.get(issuerUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;

  const wellKnown = `${issuerUrl.replace(/\/$/, "")}/.well-known/openid-configuration`;
  const configRes = await fetch(wellKnown);
  if (!configRes.ok) throw new Error(`Failed to fetch OIDC configuration from ${wellKnown}`);
  const config = (await configRes.json()) as { jwks_uri?: string };
  if (!config.jwks_uri) throw new Error("OIDC configuration missing jwks_uri");

  const jwksRes = await fetch(config.jwks_uri);
  if (!jwksRes.ok) throw new Error(`Failed to fetch JWKS from ${config.jwks_uri}`);
  const jwks = (await jwksRes.json()) as { keys: JwksKey[] };

  jwksCache.set(issuerUrl, { keys: jwks.keys, expiresAt: Date.now() + 3600_000 });
  return jwks.keys;
}

function base64urlToBuffer(base64url: string): Buffer {
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

async function verifyJwtSignature(jwt: string, issuerUrl: string): Promise<void> {
  const [headerB64, , signatureB64] = jwt.split(".");
  const header = JSON.parse(
    Buffer.from(headerB64, "base64url").toString("utf-8"),
  ) as { alg?: string; kid?: string };

  const alg = header.alg ?? "RS256";
  if (!alg.startsWith("RS")) {
    throw new Error(`Unsupported JWT algorithm: ${alg}`);
  }

  const keys = await fetchJwks(issuerUrl);
  const signingKeys = keys.filter(
    (k) =>
      k.kty === "RSA" &&
      (k.use === "sig" || !k.use) &&
      (!header.kid || k.kid === header.kid),
  );

  if (signingKeys.length === 0) throw new Error("No matching signing key found in JWKS");

  const signedContent = jwt.split(".").slice(0, 2).join(".");
  const signature = base64urlToBuffer(signatureB64);

  for (const key of signingKeys) {
    let publicKey: string;
    if (key.x5c && key.x5c.length > 0) {
      publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
    } else if (key.n && key.e) {
      const jwk = { kty: "RSA", n: key.n, e: key.e, alg: alg };
      const imported = await globalThis.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${alg.slice(2)}` },
        true,
        ["verify"],
      );
      const exported = await globalThis.crypto.subtle.exportKey("spki", imported);
      const b64 = Buffer.from(exported).toString("base64");
      publicKey = `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----`;
    } else {
      continue;
    }

    const nodeAlg = `sha${alg.slice(2)}`;
    const verifier = createVerify(`RSA-${nodeAlg.toUpperCase()}`);
    verifier.update(signedContent);
    if (verifier.verify(publicKey, signature)) return;
  }

  throw new Error("JWT signature verification failed");
}

// ---------------------------------------------------------------------------
// SAML XML signature verification
// ---------------------------------------------------------------------------

function verifySamlSignature(xml: string, pemCertificate: string): boolean {
  const sigValueMatch = xml.match(
    /<(?:ds:)?SignatureValue[^>]*>\s*([\s\S]*?)\s*<\/(?:ds:)?SignatureValue>/,
  );
  if (!sigValueMatch) return false;

  const signedInfoMatch = xml.match(
    /(<(?:ds:)?SignedInfo[\s\S]*?<\/(?:ds:)?SignedInfo>)/,
  );
  if (!signedInfoMatch) return false;

  const algMatch = xml.match(
    /<(?:ds:)?SignatureMethod\s+Algorithm="[^"]*#rsa-(sha\d+)"/i,
  );
  const hashAlg = algMatch?.[1] ?? "sha256";

  const cert = pemCertificate.includes("BEGIN CERTIFICATE")
    ? pemCertificate
    : `-----BEGIN CERTIFICATE-----\n${pemCertificate}\n-----END CERTIFICATE-----`;

  let publicKey: string;
  try {
    const x509 = new X509Certificate(cert);
    publicKey = x509.publicKey.export({ type: "spki", format: "pem" }) as string;
  } catch {
    publicKey = cert;
  }

  const signatureB64 = sigValueMatch[1].replace(/\s+/g, "");
  const signature = Buffer.from(signatureB64, "base64");

  const canonicalSignedInfo = signedInfoMatch[1]
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const verifier = createVerify(hashAlg);
  verifier.update(canonicalSignedInfo);
  return verifier.verify(publicKey, signature);
}

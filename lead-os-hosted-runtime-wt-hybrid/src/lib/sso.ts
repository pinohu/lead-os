// ---------------------------------------------------------------------------
// SSO — SAML & OIDC single sign-on (lightweight, zero heavy dependencies).
// Uses only Node.js built-ins + fetch. OIDC ID tokens are verified against
// JWKS before claims are trusted. SAML assertions fail closed until XML
// signature verification is wired through a dedicated SAML library.
// ---------------------------------------------------------------------------

import { createPublicKey, randomBytes, verify, type JsonWebKey } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OidcConfig {
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  callbackUrl: string;
  scopes: string[];
  jwksUrl?: string;
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
  const jwksUrl = process.env.LEAD_OS_SSO_OIDC_JWKS_URL;
  const callbackUrl =
    process.env.LEAD_OS_SSO_OIDC_CALLBACK_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/sso/oidc/callback`;

  if (!clientId || !clientSecret || !issuerUrl) return null;

  const scopes = (process.env.LEAD_OS_SSO_OIDC_SCOPES ?? "openid email profile").split(/[\s,]+/);

  return { clientId, clientSecret, issuerUrl, callbackUrl, scopes, jwksUrl };
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

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwksDocument = {
  keys?: JsonWebKey[];
};

export interface ParseIdTokenOptions {
  config: OidcConfig;
  expectedNonce: string;
}

function normalizeIssuer(issuerUrl: string): string {
  return issuerUrl.replace(/\/$/, "");
}

function decodeJwtJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf-8")) as T;
}

async function resolveJwksUrl(config: OidcConfig): Promise<string> {
  if (config.jwksUrl) return config.jwksUrl;

  const discoveryUrl = `${normalizeIssuer(config.issuerUrl)}/.well-known/openid-configuration`;
  const res = await fetch(discoveryUrl);
  if (!res.ok) {
    throw new Error(`OIDC discovery failed (${res.status})`);
  }

  const discovery = (await res.json()) as { jwks_uri?: string };
  if (!discovery.jwks_uri) {
    throw new Error("OIDC discovery document missing jwks_uri");
  }
  return discovery.jwks_uri;
}

async function fetchJwks(config: OidcConfig): Promise<JsonWebKey[]> {
  const jwksUrl = await resolveJwksUrl(config);
  const res = await fetch(jwksUrl);
  if (!res.ok) {
    throw new Error(`OIDC JWKS fetch failed (${res.status})`);
  }

  const jwks = (await res.json()) as JwksDocument;
  if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    throw new Error("OIDC JWKS document has no signing keys");
  }
  return jwks.keys;
}

async function verifyIdTokenSignature(
  header: JwtHeader,
  signingInput: string,
  signature: Buffer,
  config: OidcConfig,
): Promise<void> {
  if (header.alg !== "RS256") {
    throw new Error("OIDC ID token alg is unsupported; RS256 verification is required");
  }

  const keys = await fetchJwks(config);
  const jwk = keys.find((key) => {
    const candidate = key as JsonWebKey & { kid?: string; use?: string };
    const jwkKid = typeof candidate.kid === "string" ? candidate.kid : undefined;
    const jwkAlg = typeof candidate.alg === "string" ? candidate.alg : undefined;
    const jwkUse = typeof candidate.use === "string" ? candidate.use : undefined;
    return candidate.kty === "RSA" &&
      (!header.kid || jwkKid === header.kid) &&
      (!jwkAlg || jwkAlg === "RS256") &&
      (!jwkUse || jwkUse === "sig");
  });

  if (!jwk) {
    throw new Error("OIDC JWKS does not contain a matching RS256 signing key");
  }

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const ok = verify("RSA-SHA256", Buffer.from(signingInput), publicKey, signature);
  if (!ok) {
    throw new Error("OIDC ID token signature verification failed");
  }
}

function validateIdTokenClaims(payload: Record<string, unknown>, options: ParseIdTokenOptions): void {
  const issuer = payload.iss as string | undefined;
  if (normalizeIssuer(issuer ?? "") !== normalizeIssuer(options.config.issuerUrl)) {
    throw new Error("OIDC ID token issuer mismatch");
  }

  const audience = payload.aud;
  const audienceOk = typeof audience === "string"
    ? audience === options.config.clientId
    : Array.isArray(audience) && audience.includes(options.config.clientId);
  if (!audienceOk) {
    throw new Error("OIDC ID token audience mismatch");
  }

  if (!options.expectedNonce || payload.nonce !== options.expectedNonce) {
    throw new Error("OIDC ID token nonce verification failed");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (!exp || exp <= nowSeconds) {
    throw new Error("OIDC ID token is expired");
  }

  const nbf = typeof payload.nbf === "number" ? payload.nbf : undefined;
  if (nbf && nbf > nowSeconds + 60) {
    throw new Error("OIDC ID token is not yet valid");
  }
}

/**
 * Verify and parse an OIDC ID token.
 * Fails closed unless nonce and JWKS-backed signature verification complete.
 */
export async function parseIdToken(
  idToken: string,
  options?: ParseIdTokenOptions,
): Promise<SsoUserInfo> {
  if (!options) {
    throw new Error("OIDC ID token verification options are required");
  }

  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token");

  const header = decodeJwtJson<JwtHeader>(parts[0]);
  const payload = decodeJwtJson<Record<string, unknown>>(parts[1]);

  await verifyIdTokenSignature(
    header,
    `${parts[0]}.${parts[1]}`,
    Buffer.from(parts[2], "base64url"),
    options.config,
  );
  validateIdTokenClaims(payload, options);

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

  if (!entityId || !idpSsoUrl || !idpCertificate) return null;

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
 * Fails closed until XML signature verification is implemented.
 */
export function parseSamlResponse(
  samlResponseB64: string,
  config: SamlConfig,
): SsoUserInfo | null {
  // TODO(security): integrate a dedicated SAML XML signature verifier and
  // validate the assertion with config.idpCertificate before parsing claims.
  if (!config.idpCertificate) return null;

  let xml: string;
  try {
    xml = Buffer.from(samlResponseB64, "base64").toString("utf-8");
  } catch {
    return null;
  }

  if (!xml.includes("<Signature") && !xml.includes(":Signature")) {
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Generate a random string for state / nonce parameters. */
export function generateRandomState(): string {
  return randomBytes(32).toString("hex");
}

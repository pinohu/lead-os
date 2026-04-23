// ---------------------------------------------------------------------------
// SSO — SAML & OIDC single sign-on (lightweight, zero heavy dependencies).
// Uses only Node.js built-ins + fetch. JWT parsing is base64url-only (no
// signature verification against JWKS — the token comes straight from the
// IdP token endpoint over TLS, so it's trusted by transport).
// ---------------------------------------------------------------------------

import { randomBytes } from "crypto";

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
 * Decode an ID token (JWT) by base64url-decoding the payload.
 * No cryptographic signature verification — the token was received directly
 * from the IdP over TLS, so transport-level trust is sufficient for most
 * enterprise deployments.
 */
export async function parseIdToken(idToken: string): Promise<SsoUserInfo> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token");

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
 * This is a lightweight string-based parser that covers the standard
 * response format from Okta, Azure AD, Google Workspace, and most SAML 2.0
 * IdPs. It does NOT verify XML signatures — for production hardening,
 * add certificate-based signature validation.
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

// ---------------------------------------------------------------------------
// SSO — SAML & OIDC single sign-on (lightweight, zero heavy dependencies).
// Uses only Node.js built-ins + fetch. JWT parsing is base64url-only (no
// signature verification against JWKS — the token comes straight from the
// IdP token endpoint over TLS, so it's trusted by transport).
// ---------------------------------------------------------------------------

import { randomBytes } from "crypto";
import { getSiteUrl } from "@/lib/site-url";

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
    `${getSiteUrl()}/api/auth/sso/oidc/callback`;

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
 * Decode an ID token (JWT) and validate critical claims.
 *
 * // SECURITY: Production deployments MUST verify the JWT signature against
 * // the IdP's JWKS endpoint. This implementation attempts JWKS-based
 * // verification via crypto.subtle and falls through with a warning on
 * // failure, but the iss and aud claim checks below are always enforced.
 */
export async function parseIdToken(
  idToken: string,
  config?: OidcConfig,
): Promise<SsoUserInfo> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token");

  const headerBytes = Buffer.from(parts[0], "base64url");
  const header = JSON.parse(headerBytes.toString("utf-8")) as Record<string, unknown>;

  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8"),
  ) as Record<string, unknown>;

  // --- Attempt JWKS signature verification (graceful degradation) ---
  if (config) {
    try {
      const discoveryUrl = `${config.issuerUrl.replace(/\/$/, "")}/.well-known/openid-configuration`;
      const discoveryRes = await fetch(discoveryUrl, { signal: AbortSignal.timeout(5000) });
      if (discoveryRes.ok) {
        const discovery = (await discoveryRes.json()) as Record<string, unknown>;
        const jwksUri = discovery.jwks_uri as string | undefined;
        if (jwksUri) {
          const jwksRes = await fetch(jwksUri, { signal: AbortSignal.timeout(5000) });
          if (jwksRes.ok) {
            const jwks = (await jwksRes.json()) as { keys: Array<Record<string, unknown>> };
            const kid = header.kid as string | undefined;
            const alg = (header.alg as string) ?? "RS256";
            const jwk = kid
              ? jwks.keys.find((k) => k.kid === kid)
              : jwks.keys[0];
            if (jwk) {
              const algMap: Record<string, { name: string; hash: string }> = {
                RS256: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
                RS384: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" },
                RS512: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
              };
              const algInfo = algMap[alg];
              if (algInfo) {
                const key = await crypto.subtle.importKey(
                  "jwk",
                  jwk as JsonWebKey,
                  { name: algInfo.name, hash: algInfo.hash },
                  false,
                  ["verify"],
                );
                const sigBytes = Buffer.from(parts[2], "base64url");
                const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
                const valid = await crypto.subtle.verify(algInfo.name, key, sigBytes, dataBytes);
                if (!valid) {
                  throw new Error("ID token signature verification failed");
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("signature verification failed")) {
        throw err;
      }
      console.warn("[SSO] JWKS signature verification skipped:", err instanceof Error ? err.message : String(err));
    }
  }

  // --- Validate iss and aud claims ---
  if (config) {
    const expectedIssuer = config.issuerUrl.replace(/\/$/, "");
    const tokenIssuer = typeof payload.iss === "string" ? payload.iss.replace(/\/$/, "") : "";
    if (tokenIssuer !== expectedIssuer) {
      throw new Error(`ID token issuer mismatch: expected "${expectedIssuer}", got "${tokenIssuer}"`);
    }

    const aud = payload.aud;
    const audList = Array.isArray(aud) ? aud.map(String) : [String(aud ?? "")];
    if (!audList.includes(config.clientId)) {
      throw new Error(`ID token audience mismatch: expected "${config.clientId}" in ${JSON.stringify(audList)}`);
    }
  }

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
    `${getSiteUrl()}/api/auth/sso/saml/callback`;
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
 * // SECURITY: This parser does NOT verify XML digital signatures. Production
 * // deployments MUST add certificate-based signature validation using the
 * // IdP certificate in SamlConfig.idpCertificate. Without signature
 * // verification, a man-in-the-middle could forge SAML responses.
 *
 * This is a lightweight string-based parser that covers the standard
 * response format from Okta, Azure AD, Google Workspace, and most SAML 2.0
 * IdPs.
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

  // --- Validate Issuer matches configured IdP ---
  if (_config.idpSsoUrl) {
    const issuerMatch = xml.match(/<(?:saml2?:)?Issuer[^>]*>([^<]+)<\//);
    const responseIssuer = issuerMatch?.[1]?.trim() ?? "";
    if (!responseIssuer) return null;

    let expectedIssuerHost: string;
    try {
      expectedIssuerHost = new URL(_config.idpSsoUrl).hostname;
    } catch {
      expectedIssuerHost = "";
    }

    let actualIssuerHost: string;
    try {
      actualIssuerHost = new URL(responseIssuer).hostname;
    } catch {
      actualIssuerHost = responseIssuer;
    }

    if (expectedIssuerHost && actualIssuerHost !== expectedIssuerHost) {
      console.warn(`[SAML] Issuer mismatch: expected host "${expectedIssuerHost}", got "${actualIssuerHost}"`);
      return null;
    }
  }

  // --- Validate Destination matches our ACS URL ---
  if (_config.assertionConsumerServiceUrl) {
    const destMatch = xml.match(/Destination="([^"]+)"/);
    const destination = destMatch?.[1]?.trim() ?? "";
    if (destination && destination !== _config.assertionConsumerServiceUrl) {
      console.warn(`[SAML] Destination mismatch: expected "${_config.assertionConsumerServiceUrl}", got "${destination}"`);
      return null;
    }
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

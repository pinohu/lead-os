export type OperatorTokenPayload = {
  type: "magic" | "session";
  email: string;
  exp: number;
  aud?: string;
  next?: string;
};

const LOCAL_AUTH_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isRealEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function sanitizeNextPath(value?: string | null) {
  if (!value) return "/dashboard";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function normalizeOrigin(value: string) {
  return new URL(value).origin;
}

function getNormalizedHostname(origin: string) {
  try {
    return new URL(origin).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return "";
  }
}

export function isLocalAuthOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOCAL_AUTH_HOSTS.has(getNormalizedHostname(url.origin))
    );
  } catch {
    return false;
  }
}

export function resolveTrustedAuthRequest(requestUrl: string, canonicalSiteUrl: string) {
  const requestOrigin = normalizeOrigin(requestUrl);
  const canonicalOrigin = normalizeOrigin(canonicalSiteUrl);
  const trusted =
    requestOrigin === canonicalOrigin ||
    (isLocalAuthOrigin(requestOrigin) && isLocalAuthOrigin(canonicalOrigin));

  return {
    trusted,
    requestOrigin,
    canonicalOrigin,
    tokenAudience: canonicalOrigin,
  };
}

export function getAllowedOperatorEmails(configured: string | undefined) {
  return [
    ...new Set(
      (configured ?? "")
        .split(/[,\n;]/g)
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeEmail)
        .filter(isRealEmail),
    ),
  ];
}

export function isAllowedOperatorEmail(email: string, allowedEmails: string[]) {
  return allowedEmails.includes(normalizeEmail(email));
}

function timingSafeStringEqual(actual: string, expected: string) {
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index++) {
    mismatch |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("base64url");
}

export async function issueOperatorToken(payload: OperatorTokenPayload, secret: string) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = await signValue(body, secret);
  return `${body}.${signature}`;
}

export async function decodeOperatorToken(
  token: string,
  expectedType: OperatorTokenPayload["type"],
  secret: string,
  allowedEmails: string[],
  expectedAudience?: string | null,
) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = await signValue(body, secret);
  if (!timingSafeStringEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OperatorTokenPayload;
    if (payload.type !== expectedType) return null;
    if (payload.exp < Date.now()) return null;
    if (!isAllowedOperatorEmail(payload.email, allowedEmails)) return null;
    if (expectedAudience && payload.aud !== normalizeOrigin(expectedAudience)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createMagicLinkUrl(
  email: string,
  canonicalSiteUrl: string,
  secret: string,
  allowedEmails: string[],
  nextPath?: string,
  audience?: string,
) {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedOperatorEmail(normalizedEmail, allowedEmails)) {
    throw new Error("Operator email is not approved.");
  }

  const canonicalOrigin = normalizeOrigin(canonicalSiteUrl);
  const token = await issueOperatorToken(
    {
      type: "magic",
      email: normalizedEmail,
      exp: Date.now() + 15 * 60 * 1000,
      aud: normalizeOrigin(audience ?? canonicalOrigin),
      next: sanitizeNextPath(nextPath),
    },
    secret,
  );
  const url = new URL("/auth/verify", canonicalOrigin);
  url.searchParams.set("token", token);
  url.searchParams.set("next", sanitizeNextPath(nextPath));
  return { url: url.toString(), token };
}

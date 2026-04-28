export const DASHBOARD_AUTH_COOKIE = "lead_os_dashboard_auth";
export const DASHBOARD_AUTH_REALM = "Lead OS";

type SharedSecretAuthOptions = {
  cookieNames?: string[];
  allowBasic?: boolean;
  allowBearer?: boolean;
};

export function normalizeSecret(value?: string | null) {
  return value?.trim() ?? "";
}

export function hasConfiguredSecret(value?: string | null) {
  return normalizeSecret(value).length > 0;
}

export function timingSafeEqualString(leftValue?: string | null, rightValue?: string | null) {
  const left = normalizeSecret(leftValue);
  const right = normalizeSecret(rightValue);

  if (!left || !right) return false;

  let mismatch = left.length === right.length ? 0 : 1;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index++) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function decodeBase64(value: string) {
  if (typeof atob === "function") {
    return atob(value);
  }

  return Buffer.from(value, "base64").toString("utf8");
}

function getBasicPassword(authorizationHeader: string) {
  const encoded = authorizationHeader.slice("Basic ".length).trim();
  if (!encoded) return "";

  try {
    const decoded = decodeBase64(encoded);
    const separatorIndex = decoded.indexOf(":");
    return separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";
  } catch {
    return "";
  }
}

function getBearerToken(authorizationHeader: string) {
  return authorizationHeader.slice("Bearer ".length).trim();
}

export function hasAuthorizationSecret(
  headers: Headers,
  secret: string | undefined | null,
  options: SharedSecretAuthOptions = {},
) {
  const configuredSecret = normalizeSecret(secret);
  if (!configuredSecret) return false;

  const authorizationHeader = headers.get("authorization")?.trim() ?? "";
  const allowBearer = options.allowBearer ?? true;
  const allowBasic = options.allowBasic ?? true;

  if (allowBearer && authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return timingSafeEqualString(getBearerToken(authorizationHeader), configuredSecret);
  }

  if (allowBasic && authorizationHeader.toLowerCase().startsWith("basic ")) {
    return timingSafeEqualString(getBasicPassword(authorizationHeader), configuredSecret);
  }

  return false;
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return "";

  for (const cookie of cookieHeader.split(";")) {
    const trimmed = cookie.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) continue;

    const cookieName = trimmed.slice(0, separatorIndex);
    if (cookieName !== name) continue;

    const rawValue = trimmed.slice(separatorIndex + 1);
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return "";
}

export function hasCookieSecret(headers: Headers, secret: string | undefined | null, cookieNames: string[] = []) {
  const configuredSecret = normalizeSecret(secret);
  if (!configuredSecret || cookieNames.length === 0) return false;

  const cookieHeader = headers.get("cookie");
  return cookieNames.some((cookieName) =>
    timingSafeEqualString(getCookieValue(cookieHeader, cookieName), configuredSecret),
  );
}

export function hasSharedSecretAuth(
  headers: Headers,
  secret: string | undefined | null,
  options: SharedSecretAuthOptions = {},
) {
  return hasAuthorizationSecret(headers, secret, options)
    || hasCookieSecret(headers, secret, options.cookieNames ?? []);
}

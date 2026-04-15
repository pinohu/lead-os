// ── PII-Redacting Logger ──────────────────────────────────────────────
// Wraps console.log/warn/error to strip emails, phones, and names
// from production log output. Keeps full detail in development.

type LogLevel = "info" | "warn" | "error" | "debug";

/** Redact email: john@example.com → j***@example.com */
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  return `${local[0]}***@${domain}`;
}

/** Redact phone: +18145550101 → ***-**-0101 */
function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `***-**-${digits.slice(-4)}`;
}

/**
 * Redact known secret formats inside a free-form string. Keeps a short
 * prefix so operators can still distinguish environments at a glance
 * (e.g. `sk_live_***` vs `sk_test_***`) without exposing the key body.
 */
function redactSecrets(str: string): string {
  return (
    str
      // Stripe-style keys: sk_live_XXX, sk_test_XXX, pk_live_XXX, rk_XXX
      .replace(/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{4,}/g, "$1_$2_***")
      // Stripe webhook signing secret
      .replace(/\bwhsec_[A-Za-z0-9]{4,}/g, "whsec_***")
      // GitHub tokens, generic high-entropy bearer tokens in headers
      .replace(/\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{16,}/g, "$1_***")
      // `Bearer <token>` / `Authorization: Bearer ...`
      .replace(/\bBearer\s+[A-Za-z0-9._\-]{8,}/gi, "Bearer ***")
      // Our own API key format: `ep_<64 hex>` (see /api/provider/api-keys)
      .replace(/\bep_[a-f0-9]{16,}/g, "ep_***")
  );
}

/** Redact PII patterns in a string */
function redactString(str: string): string {
  // Secret tokens first — running this before the phone/email regexes
  // keeps long hex tokens from being partially eaten by the phone regex.
  str = redactSecrets(str);

  // Email pattern
  str = str.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => redactEmail(match)
  );

  // Phone patterns: (814) 555-0101, 814-555-0101, +18145550101, etc.
  str = str.replace(
    /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    (match) => redactPhone(match)
  );

  return str;
}

/**
 * Field names whose values should be redacted regardless of content.
 * Lowercased for case-insensitive matching. We redact the whole value
 * (not a partial mask) because these fields are never safe to log.
 */
const SECRET_KEY_NAMES = new Set([
  "password",
  "passwordhash",
  "passwordconfirm",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "sessiontoken",
  "apikey",
  "api_key",
  "rawkey",
  "keyhash",
  "secret",
  "clientsecret",
  "authsecret",
  "webhooksecret",
  "cronsecret",
  "adminaccesskey",
  "stripesecretkey",
  "stripewebhooksecret",
  "authorization",
  "cookie",
  "setcookie",
  "set-cookie",
]);

/** Recursively redact PII from any value */
function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (value instanceof Error) {
    return { message: redactString(value.message), stack: value.stack };
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (value !== null && typeof value === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const lk = key.toLowerCase();
      if (SECRET_KEY_NAMES.has(lk)) {
        // Never recurse into a secret field — just mask the whole thing.
        redacted[key] = "***";
      } else if (lk === "email" || lk === "provideremail" || lk === "buyeremail") {
        redacted[key] = typeof val === "string" ? redactEmail(val) : "***";
      } else if (lk === "phone" || lk === "callerphone") {
        redacted[key] = typeof val === "string" ? redactPhone(val) : "***";
      } else {
        redacted[key] = redactValue(val);
      }
    }
    return redacted;
  }
  return value;
}

const isDev = process.env.NODE_ENV === "development";

function log(level: LogLevel, tag: string, ...args: unknown[]) {
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.log;

  const prefix = `[${tag}]`;

  if (isDev) {
    // In dev, show everything unredacted for debugging
    fn(prefix, ...args);
  } else {
    // In production, redact PII and use structured JSON
    const redactedArgs = args.map(redactValue);
    fn(JSON.stringify({ level, tag, data: redactedArgs, ts: Date.now() }));
  }
}

export const logger = {
  info: (tag: string, ...args: unknown[]) => log("info", tag, ...args),
  warn: (tag: string, ...args: unknown[]) => log("warn", tag, ...args),
  error: (tag: string, ...args: unknown[]) => log("error", tag, ...args),
  debug: (tag: string, ...args: unknown[]) => log("debug", tag, ...args),
};

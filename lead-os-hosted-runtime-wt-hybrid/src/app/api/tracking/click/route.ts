import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { recordEmailEvent } from "@/lib/email-tracking";
import { tenantConfig } from "@/lib/tenant";

// Enforce http/https only — redundant with isValidUrl but acts as a fast-path
// guard in case protocol parsing changes upstream.
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:", "blob:", "file:"];

const MAX_LEAD_KEY_LENGTH = 128;
const MAX_EMAIL_ID_LENGTH = 128;
const SAFE_ID_PATTERN = /^[\w-]{1,128}$/;

const clickTrackingStore: Array<{
  leadKey: string;
  emailId: string;
  url: string;
  event: "clicked";
  timestamp: string;
  ip?: string;
  userAgent?: string;
}> = [];

function isUrlSafe(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return !BLOCKED_PROTOCOLS.some((protocol) => trimmed.startsWith(protocol));
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Prevents open redirect by requiring the target URL's hostname to belong to
 * the configured site domain or one of the allowed widget origins.
 *
 * Without this check any attacker can craft a phishing URL that passes through
 * this tracker:  /api/tracking/click?url=https://evil.com
 *
 * In production configure LEAD_OS_ALLOWED_REDIRECT_HOSTS as a comma-separated
 * list of trusted hostnames. Falls back to the site's own hostname when unset.
 */
function isAllowedRedirectTarget(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const siteHostname = (() => {
    try {
      return new URL(tenantConfig.siteUrl).hostname;
    } catch {
      return null;
    }
  })();

  const envHosts = process.env.LEAD_OS_ALLOWED_REDIRECT_HOSTS
    ? process.env.LEAD_OS_ALLOWED_REDIRECT_HOSTS.split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const widgetHostnames = tenantConfig.widgetOrigins.flatMap((origin) => {
    try {
      return [new URL(origin).hostname];
    } catch {
      return [];
    }
  });

  const allowedHosts = new Set<string>([
    ...(siteHostname ? [siteHostname] : []),
    ...envHosts,
    ...widgetHostnames,
  ]);

  if (allowedHosts.size === 0) {
    // No allowlist configured — permit all http/https targets so the feature
    // works out of the box, but log a warning.
    // TODO: Set LEAD_OS_ALLOWED_REDIRECT_HOSTS in production to restrict targets.
    return true;
  }

  return allowedHosts.has(parsed.hostname.toLowerCase());
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const reqUrl = new URL(request.url);
  const leadKey = reqUrl.searchParams.get("leadKey");
  const emailId = reqUrl.searchParams.get("emailId");
  const targetUrl = reqUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { data: null, error: { code: "MISSING_URL", message: "url parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  if (!isUrlSafe(targetUrl) || !isValidUrl(targetUrl)) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_URL", message: "URL is not allowed" }, meta: null },
      { status: 400, headers },
    );
  }

  if (!isAllowedRedirectTarget(targetUrl)) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_URL", message: "Redirect target is not permitted" }, meta: null },
      { status: 400, headers },
    );
  }

  if (leadKey && emailId) {
    const leadKeyValid =
      leadKey.length <= MAX_LEAD_KEY_LENGTH && SAFE_ID_PATTERN.test(leadKey);
    const emailIdValid =
      emailId.length <= MAX_EMAIL_ID_LENGTH && SAFE_ID_PATTERN.test(emailId);

    if (leadKeyValid && emailIdValid) {
      const rawForwardedFor = request.headers.get("x-forwarded-for");
      const clientIp = rawForwardedFor
        ? rawForwardedFor.split(",")[0].trim()
        : undefined;

      clickTrackingStore.push({
        leadKey,
        emailId,
        url: targetUrl,
        event: "clicked",
        timestamp: new Date().toISOString(),
        ip: clientIp,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      recordEmailEvent({
        leadKey,
        emailId,
        eventType: "clicked",
        linkUrl: targetUrl,
      }).catch(() => {
        // Persistence failure must not break the redirect
      });

      // Fire-and-forget rescore after email click
      import("@/lib/rescore-engine")
        .then((m) => m.rescoreLead(leadKey, { type: "email-click" }))
        .catch(() => {});
    }
  }

  return NextResponse.redirect(targetUrl, 302);
}


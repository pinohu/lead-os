import { NextResponse } from "next/server";
import {
  DASHBOARD_AUTH_COOKIE,
  hasConfiguredSecret,
  hasSharedSecretAuth,
} from "@/lib/admin-auth";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import {
  assertPublicHttpsTarget,
  resolveHostnameWithDns,
  UnsafeTargetError,
} from "@/lib/ssrf-guards";
import {
  analyzeWebsite,
  synthesizeLeadOsManifest,
  type WebsiteIntelligenceInput,
} from "@/lib/website-intelligence";

const MAX_TARGET_HTML_BYTES = 1_000_000;
const TARGET_FETCH_TIMEOUT_MS = 5_000;
const MAX_TARGET_REDIRECTS = 3;

class AnalyzeRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AnalyzeRequestError";
    this.status = status;
  }
}

function getAuthFailure(request: Request) {
  const automationSecret = process.env.AUTOMATION_API_SECRET ?? embeddedSecrets.automation.apiSecret;
  const dashboardSecret = process.env.DASHBOARD_SECRET ?? embeddedSecrets.dashboard.secret;
  const hasAutomationAuth = hasSharedSecretAuth(request.headers, automationSecret, { allowBasic: false });
  const hasDashboardAuth = hasSharedSecretAuth(request.headers, dashboardSecret, {
    cookieNames: [DASHBOARD_AUTH_COOKIE],
  });

  if (!hasConfiguredSecret(automationSecret) && !hasConfiguredSecret(dashboardSecret)) {
    return { error: "AUTOMATION_API_SECRET or DASHBOARD_SECRET must be configured.", status: 503 };
  }

  return hasAutomationAuth || hasDashboardAuth
    ? null
    : { error: "Unauthorized", status: 401 };
}

function assertHtmlSize(value: string) {
  if (new TextEncoder().encode(value).byteLength > MAX_TARGET_HTML_BYTES) {
    throw new AnalyzeRequestError("HTML input is too large.", 413);
  }
}

async function readCappedText(response: Response) {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_TARGET_HTML_BYTES) {
    throw new AnalyzeRequestError("Target response is too large.", 413);
  }

  if (!response.body) {
    const text = await response.text();
    assertHtmlSize(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_TARGET_HTML_BYTES) {
      await reader.cancel();
      throw new AnalyzeRequestError("Target response is too large.", 413);
    }

    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TARGET_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        "user-agent": "LeadOS-IntelligenceBot/1.0 (+https://github.com/pinohu/lead-os)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AnalyzeRequestError("Target website fetch timed out.", 504);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateTargetUrl(url: string) {
  return assertPublicHttpsTarget(url, { resolveHostname: resolveHostnameWithDns });
}

async function fetchTargetHtml(url: string) {
  let targetUrl = await validateTargetUrl(url);

  for (let redirectCount = 0; redirectCount <= MAX_TARGET_REDIRECTS; redirectCount++) {
    const response = await fetchWithTimeout(targetUrl);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new AnalyzeRequestError("Target website returned a redirect without a location.", 502);
      }

      targetUrl = await validateTargetUrl(new URL(location, targetUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new AnalyzeRequestError(`Failed to fetch target website (${response.status})`, 502);
    }

    return readCappedText(response);
  }

  throw new AnalyzeRequestError("Target website redirected too many times.", 508);
}

export async function POST(request: Request) {
  try {
    const authFailure = getAuthFailure(request);
    if (authFailure) {
      return NextResponse.json(
        { success: false, error: authFailure.error },
        { status: authFailure.status },
      );
    }

    const body = (await request.json()) as WebsiteIntelligenceInput;
    const url = typeof body.url === "string" ? body.url.trim() : "";
    let html = typeof body.html === "string" ? body.html : "";

    if (!html && url) {
      html = await fetchTargetHtml(url);
    }

    if (html) {
      assertHtmlSize(html);
    }

    if (!html) {
      return NextResponse.json(
        { success: false, error: "Provide a website URL or raw HTML to analyze." },
        { status: 400 },
      );
    }

    const analysis = analyzeWebsite({ ...body, url, html });
    const manifest = synthesizeLeadOsManifest(analysis);

    return NextResponse.json({
      success: true,
      analysis,
      manifest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analysis failure";
    const status = error instanceof AnalyzeRequestError || error instanceof UnsafeTargetError
      ? error.status
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

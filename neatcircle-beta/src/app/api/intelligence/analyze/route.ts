import { NextResponse } from "next/server";
import {
  analyzeWebsite,
  synthesizeLeadOsManifest,
  type WebsiteIntelligenceInput,
} from "@/lib/website-intelligence";

function isBlockedUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return true;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return true;
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127)
    ) {
      return true;
    }
  }

  if (hostname.includes("metadata") || hostname === "169.254.169.254") return true;

  return false;
}

async function fetchTargetHtml(url: string) {
  if (isBlockedUrl(url)) {
    throw new Error("URL is not allowed: only public http/https URLs are accepted.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "LeadOS-IntelligenceBot/1.0 (+https://github.com/pinohu/lead-os)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") ?? "";
      if (isBlockedUrl(location)) {
        throw new Error("Redirect target is not allowed.");
      }
      throw new Error(`Target website returned redirect (${response.status}) — follow manually.`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch target website (${response.status})`);
    }

    const text = await response.text();
    const MAX_HTML_SIZE = 2 * 1024 * 1024;
    if (text.length > MAX_HTML_SIZE) {
      throw new Error("Response body exceeds the 2 MB limit.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebsiteIntelligenceInput;
    const url = typeof body.url === "string" ? body.url.trim() : "";
    let html = typeof body.html === "string" ? body.html : "";

    if (!html && url) {
      html = await fetchTargetHtml(url);
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
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

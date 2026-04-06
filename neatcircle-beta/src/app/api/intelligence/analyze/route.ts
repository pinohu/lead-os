import { NextResponse } from "next/server";
import {
  analyzeWebsite,
  synthesizeLeadOsManifest,
  type WebsiteIntelligenceInput,
} from "@/lib/website-intelligence";

function isAllowedUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
    if (hostname === "metadata.google.internal") return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchTargetHtml(url: string) {
  if (!isAllowedUrl(url)) {
    throw new Error("URL is not allowed. Only public HTTP(S) URLs are accepted.");
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
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch target website (${response.status})`);
    }

    return response.text();
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

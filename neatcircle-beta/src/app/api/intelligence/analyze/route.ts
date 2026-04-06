import { NextResponse } from "next/server";
import {
  analyzeWebsite,
  synthesizeLeadOsManifest,
  type WebsiteIntelligenceInput,
} from "@/lib/website-intelligence";

function isPrivateHost(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  const bare = hostname.replace(/^\[|\]$/g, "");

  if (bare.startsWith("fc00:") || bare.startsWith("fe80:") || bare === "::1") {
    return true;
  }

  const parts = bare.split(".").map(Number);
  if (parts.length === 4 && parts.every((n) => n >= 0 && n <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;
  }

  return false;
}

function validateFetchUrl(raw: string): URL {
  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("disallowed scheme");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("disallowed host");
  }
  return parsed;
}

async function fetchTargetHtml(url: string) {
  const validated = validateFetchUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(validated.href, {
      headers: {
        "user-agent": "LeadOS-IntelligenceBot/1.0 (+https://github.com/pinohu/lead-os)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: controller.signal,
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
      try {
        validateFetchUrl(url);
      } catch {
        return NextResponse.json(
          { success: false, error: "The provided URL is not allowed." },
          { status: 400 },
        );
      }
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

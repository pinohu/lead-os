import { NextResponse } from "next/server";
import {
  analyzeWebsite,
  synthesizeLeadOsManifest,
  type WebsiteIntelligenceInput,
} from "@/lib/website-intelligence";
import { validateExternalUrl } from "@/lib/validate-url";

async function fetchTargetHtml(rawUrl: string) {
  const check = validateExternalUrl(rawUrl);
  if (!check.valid) {
    throw new Error(`URL rejected: ${check.reason}`);
  }

  const response = await fetch(check.url.href, {
    headers: {
      "user-agent": "LeadOS-IntelligenceBot/1.0 (+https://github.com/pinohu/lead-os)",
      accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch target website (${response.status})`);
  }

  return response.text();
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

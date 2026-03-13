import { NextResponse } from "next/server";
import {
  analyzeWebsite,
  manifestToEnvExample,
  synthesizeLeadOsManifest,
  type WebsiteIntelligenceAnalysis,
  type WebsiteIntelligenceInput,
} from "@/lib/website-intelligence";

function isAnalysisPayload(value: unknown): value is WebsiteIntelligenceAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Boolean(candidate.business && candidate.funnel && candidate.design && candidate.architecture);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      analysis?: WebsiteIntelligenceAnalysis;
      input?: WebsiteIntelligenceInput;
    };

    const analysis = isAnalysisPayload(body.analysis)
      ? body.analysis
      : analyzeWebsite(body.input ?? {});

    const manifest = synthesizeLeadOsManifest(analysis);

    return NextResponse.json({
      success: true,
      manifest,
      envExample: manifestToEnvExample(manifest),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate manifest";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

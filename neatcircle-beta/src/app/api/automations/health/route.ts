import { NextResponse } from "next/server";
import { checkConnectivity } from "@/lib/suitedash";

const AUTOMATIONS = [
  { name: "Client Portal", slug: "client-portal", method: "POST", category: "core" },
  { name: "Process Automation", slug: "process-automation", method: "POST", category: "core" },
  { name: "Systems Integration", slug: "systems-integration", method: "POST", category: "core" },
  { name: "Training Platform", slug: "training-platform", method: "POST", category: "core" },
  { name: "Business Intelligence", slug: "business-intelligence", method: "POST", category: "core" },
  { name: "Digital Transformation", slug: "digital-transformation", method: "POST", category: "core" },
  { name: "Compliance Training", slug: "compliance-training", method: "POST", category: "core" },
  { name: "Managed Services", slug: "managed-services", method: "POST", category: "core" },
  { name: "RE Syndication", slug: "re-syndication", method: "POST", category: "blue-ocean" },
  { name: "Immigration Law", slug: "immigration-law", method: "POST", category: "blue-ocean" },
  { name: "Construction", slug: "construction", method: "POST", category: "blue-ocean" },
  { name: "Franchise", slug: "franchise", method: "POST", category: "blue-ocean" },
  { name: "Staffing", slug: "staffing", method: "POST", category: "blue-ocean" },
  { name: "Church Management", slug: "church-management", method: "POST", category: "blue-ocean" },
  { name: "Creator Management", slug: "creator-management", method: "POST", category: "blue-ocean" },
  { name: "Compliance Productized", slug: "compliance-productized", method: "POST", category: "blue-ocean" },
] as const;

export async function GET() {
  try {
    const suitedashConnected = await checkConnectivity();

    const automations = AUTOMATIONS.map((a) => ({
      name: a.name,
      category: a.category,
      method: a.method,
      url: `/api/automations/${a.slug}`,
    }));

    return NextResponse.json({
      status: suitedashConnected ? "healthy" : "degraded",
      suitedash: suitedashConnected ? "connected" : "unreachable",
      automationCount: AUTOMATIONS.length,
      automations,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      {
        status: "error",
        suitedash: "unreachable",
        automationCount: AUTOMATIONS.length,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface IntegrationMapping {
  source: string;
  destination: string;
  dataType: string;
}

interface SystemsIntegrationRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  existingSystems?: string[];
  desiredIntegrations?: IntegrationMapping[];
  syncFrequency?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SystemsIntegrationRequest>;

    const {
      companyName, firstName, lastName, email, phone,
      existingSystems, desiredIntegrations, syncFrequency,
    } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["systems-integration", serverSiteConfig.tenantSlug];
    if (existingSystems) {
      for (const s of existingSystems) {
        tags.push(s.toLowerCase().replace(/\s+/g, "-"));
      }
    }
    if (syncFrequency) {
      tags.push(`sync-${syncFrequency.toLowerCase().replace(/\s+/g, "-")}`);
    }

    const integrationNotes = desiredIntegrations?.map(
      (i) => `${i.source} -> ${i.destination} (${i.dataType})`,
    ).join("\n") ?? "";

    const companyResult = await createCompany({
      name: companyName,
      role: "Lead",
      primaryContact: {
        email,
        first_name: firstName,
        last_name: lastName,
        create_primary_contact_if_not_exists: true,
      },
      phone,
      tags,
      background_info: [
        existingSystems?.length ? `Existing systems: ${existingSystems.join(", ")}` : "",
        integrationNotes ? `Desired integrations:\n${integrationNotes}` : "",
        syncFrequency ? `Sync frequency: ${syncFrequency}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "systems-integration",
      companyUid: companyResult.data?.uid,
      message: "Systems integration intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("systems-integration error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "systems-integration" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

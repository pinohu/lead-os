import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface BusinessIntelligenceRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dataSources?: string[];
  kpis?: string[];
  reportingFrequency?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BusinessIntelligenceRequest>;

    const {
      companyName, firstName, lastName, email, phone,
      dataSources, kpis, reportingFrequency,
    } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["bi-setup", serverSiteConfig.tenantSlug];
    if (dataSources) {
      for (const ds of dataSources) {
        tags.push(`ds-${ds.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }
    if (kpis) {
      for (const kpi of kpis) {
        tags.push(`kpi-${kpi.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }
    if (reportingFrequency) {
      tags.push(`reporting-${reportingFrequency.toLowerCase().replace(/\s+/g, "-")}`);
    }

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
        dataSources?.length ? `Data sources: ${dataSources.join(", ")}` : "",
        kpis?.length ? `KPIs: ${kpis.join(", ")}` : "",
        reportingFrequency ? `Reporting frequency: ${reportingFrequency}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "business-intelligence",
      companyUid: companyResult.data?.uid,
      message: "Business intelligence setup recorded in SuiteDash",
    });
  } catch (err) {
    console.error("business-intelligence error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "business-intelligence" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

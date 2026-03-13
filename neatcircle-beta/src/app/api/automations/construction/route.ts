import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface ConstructionRequest {
  companyName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  projectTypes?: string[];
  annualRevenue?: number;
  employeeCount?: number;
  safetyProgram?: boolean;
}

function revenueRangeTag(revenue: number): string {
  if (revenue <= 1_000_000) return "revenue-under-1m";
  if (revenue <= 5_000_000) return "revenue-1m-5m";
  if (revenue <= 25_000_000) return "revenue-5m-25m";
  return "revenue-25m-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ConstructionRequest>;

    const { companyName, contactInfo, projectTypes, annualRevenue, employeeCount, safetyProgram } = body;

    if (!companyName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "companyName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["construction", serverSiteConfig.tenantSlug];
    if (projectTypes) {
      for (const pt of projectTypes) {
        tags.push(`project-${pt.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }
    if (typeof annualRevenue === "number") tags.push(revenueRangeTag(annualRevenue));
    if (safetyProgram) tags.push("safety-program");

    const companyResult = await createCompany({
      name: companyName,
      role: "Lead",
      primaryContact: {
        email: contactInfo.email,
        first_name: contactInfo.firstName,
        last_name: contactInfo.lastName,
        create_primary_contact_if_not_exists: true,
      },
      phone: contactInfo.phone,
      tags,
      background_info: [
        projectTypes?.length ? `Project types: ${projectTypes.join(", ")}` : "",
        typeof annualRevenue === "number" ? `Annual revenue: $${annualRevenue.toLocaleString()}` : "",
        typeof employeeCount === "number" ? `Employee count: ${employeeCount}` : "",
        safetyProgram !== undefined ? `Safety program: ${safetyProgram ? "Yes" : "No"}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "construction",
      companyUid: companyResult.data?.uid,
      message: "Construction company intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("construction error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "construction" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

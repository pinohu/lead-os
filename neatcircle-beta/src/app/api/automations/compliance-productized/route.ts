import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

type TargetMarket = "hr-consulting" | "peo" | "payroll" | "insurance";
type PricingModel = "per-employee" | "flat-rate" | "tiered";

interface ComplianceProductizedRequest {
  resellerName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  targetMarket?: TargetMarket;
  clientCount?: number;
  pricingModel?: PricingModel;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ComplianceProductizedRequest>;

    const { resellerName, contactInfo, targetMarket, clientCount, pricingModel } = body;

    if (!resellerName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "resellerName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["compliance-productized", serverSiteConfig.tenantSlug];
    if (targetMarket) tags.push(`market-${targetMarket}`);
    if (pricingModel) tags.push(`pricing-${pricingModel}`);

    const companyResult = await createCompany({
      name: resellerName,
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
        targetMarket ? `Target market: ${targetMarket}` : "",
        typeof clientCount === "number" ? `Client count: ${clientCount}` : "",
        pricingModel ? `Pricing model: ${pricingModel}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "compliance-productized",
      companyUid: companyResult.data?.uid,
      message: "Compliance productized reseller intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("compliance-productized error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "compliance-productized" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

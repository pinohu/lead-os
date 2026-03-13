import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface ManagedServicesRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  plan?: string;
  currentTools?: string[];
  painPoints?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ManagedServicesRequest>;

    const {
      companyName, firstName, lastName, email, phone,
      plan, currentTools, painPoints,
    } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["managed-services", serverSiteConfig.tenantSlug];
    if (plan) tags.push(`plan-${plan.toLowerCase().replace(/\s+/g, "-")}`);
    if (currentTools) {
      for (const t of currentTools) {
        tags.push(t.toLowerCase().replace(/\s+/g, "-"));
      }
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
        plan ? `Plan: ${plan}` : "",
        currentTools?.length ? `Current tools: ${currentTools.join(", ")}` : "",
        painPoints?.length ? `Pain points: ${painPoints.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "managed-services",
      companyUid: companyResult.data?.uid,
      message: "Managed services intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("managed-services error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "managed-services" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

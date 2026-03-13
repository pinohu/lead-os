import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface ClientPortalRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  domain?: string;
  industry?: string;
  features?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ClientPortalRequest>;

    const { companyName, firstName, lastName, email, phone, domain, industry, features } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const companyTags = ["client-portal", serverSiteConfig.tenantSlug];
    if (industry) companyTags.push(industry.toLowerCase().replace(/\s+/g, "-"));
    if (features) {
      for (const f of features) {
        companyTags.push(f.toLowerCase().replace(/\s+/g, "-"));
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
      website: domain,
      tags: companyTags,
      background_info: [
        `Portal setup request`,
        domain ? `Portal domain: ${domain}` : "",
        features?.length ? `Features: ${features.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "client-portal",
      companyUid: companyResult.data?.uid,
      message: "Client portal setup initiated in SuiteDash",
    });
  } catch (err) {
    console.error("client-portal automation error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "client-portal" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

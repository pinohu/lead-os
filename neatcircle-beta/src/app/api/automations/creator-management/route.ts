import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

type Platform = "youtube" | "tiktok" | "instagram" | "twitch" | "podcast";
type CreatorService = "contracts" | "revenue" | "content" | "brand-deals";

interface CreatorManagementRequest {
  agencyName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  talentCount?: number;
  platforms?: Platform[];
  services?: CreatorService[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreatorManagementRequest>;

    const { agencyName, contactInfo, talentCount, platforms, services } = body;

    if (!agencyName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "agencyName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["creator-management", serverSiteConfig.tenantSlug];
    if (platforms) {
      for (const p of platforms) {
        tags.push(`platform-${p}`);
      }
    }
    if (services) {
      for (const s of services) {
        tags.push(`service-${s}`);
      }
    }

    const companyResult = await createCompany({
      name: agencyName,
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
        typeof talentCount === "number" ? `Talent count: ${talentCount}` : "",
        platforms?.length ? `Platforms: ${platforms.join(", ")}` : "",
        services?.length ? `Services: ${services.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "creator-management",
      companyUid: companyResult.data?.uid,
      message: "Creator management intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("creator-management error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "creator-management" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

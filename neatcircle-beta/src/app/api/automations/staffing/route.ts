import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface StaffingRequest {
  agencyName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  specialties?: string[];
  placementsPerMonth?: number;
  clientCount?: number;
}

function volumeRangeTag(placements: number): string {
  if (placements <= 10) return "volume-1-10";
  if (placements <= 50) return "volume-11-50";
  if (placements <= 200) return "volume-51-200";
  return "volume-200-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<StaffingRequest>;

    const { agencyName, contactInfo, specialties, placementsPerMonth, clientCount } = body;

    if (!agencyName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "agencyName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["staffing", serverSiteConfig.tenantSlug];
    if (specialties) {
      for (const s of specialties) {
        tags.push(`specialty-${s.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }
    if (typeof placementsPerMonth === "number") {
      tags.push(volumeRangeTag(placementsPerMonth));
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
        specialties?.length ? `Specialties: ${specialties.join(", ")}` : "",
        typeof placementsPerMonth === "number" ? `Placements/month: ${placementsPerMonth}` : "",
        typeof clientCount === "number" ? `Client count: ${clientCount}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "staffing",
      companyUid: companyResult.data?.uid,
      message: "Staffing agency intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("staffing error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "staffing" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

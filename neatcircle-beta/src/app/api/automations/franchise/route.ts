import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";

interface FranchiseRequest {
  brandName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  locationCount?: number;
  expansionPlans?: string;
  trainingNeeds?: string[];
}

function locationRangeTag(count: number): string {
  if (count <= 5) return "locations-1-5";
  if (count <= 25) return "locations-6-25";
  if (count <= 100) return "locations-26-100";
  return "locations-100-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<FranchiseRequest>;

    const { brandName, contactInfo, locationCount, expansionPlans, trainingNeeds } = body;

    if (!brandName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "brandName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["franchise", "neatcircle"];
    if (typeof locationCount === "number") tags.push(locationRangeTag(locationCount));
    if (trainingNeeds) {
      for (const tn of trainingNeeds) {
        tags.push(`training-${tn.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }

    const companyResult = await createCompany({
      name: brandName,
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
        typeof locationCount === "number" ? `Location count: ${locationCount}` : "",
        expansionPlans ? `Expansion plans: ${expansionPlans}` : "",
        trainingNeeds?.length ? `Training needs: ${trainingNeeds.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "franchise",
      companyUid: companyResult.data?.uid,
      message: "Franchise intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("franchise error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "franchise" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

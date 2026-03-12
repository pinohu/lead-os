import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";

type DealType = "equity" | "debt" | "preferred";

interface ReSyndicationRequest {
  syndicationName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  dealType?: DealType;
  targetRaise?: number;
  propertyType?: string;
  investorCount?: number;
}

function raiseRangeTag(amount: number): string {
  if (amount <= 1_000_000) return "raise-under-1m";
  if (amount <= 5_000_000) return "raise-1m-5m";
  if (amount <= 25_000_000) return "raise-5m-25m";
  return "raise-25m-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ReSyndicationRequest>;

    const { syndicationName, contactInfo, dealType, targetRaise, propertyType, investorCount } = body;

    if (!syndicationName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "syndicationName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["re-syndication", "neatcircle"];
    if (dealType) tags.push(`deal-${dealType}`);
    if (propertyType) tags.push(propertyType.toLowerCase().replace(/\s+/g, "-"));
    if (typeof targetRaise === "number") tags.push(raiseRangeTag(targetRaise));

    const companyResult = await createCompany({
      name: syndicationName,
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
        dealType ? `Deal type: ${dealType}` : "",
        typeof targetRaise === "number" ? `Target raise: $${targetRaise.toLocaleString()}` : "",
        propertyType ? `Property type: ${propertyType}` : "",
        typeof investorCount === "number" ? `Investor count: ${investorCount}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "re-syndication",
      companyUid: companyResult.data?.uid,
      message: "RE syndication intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("re-syndication error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "re-syndication" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

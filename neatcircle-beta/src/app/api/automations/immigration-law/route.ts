import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";

type VisaType = "h1b" | "eb5" | "family" | "asylum" | "naturalization";

interface ImmigrationLawRequest {
  firmName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  visaTypes?: VisaType[];
  caseVolume?: number;
  languages?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ImmigrationLawRequest>;

    const { firmName, contactInfo, visaTypes, caseVolume, languages } = body;

    if (!firmName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "firmName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["immigration-law", "neatcircle"];
    if (visaTypes) {
      for (const v of visaTypes) {
        tags.push(`visa-${v}`);
      }
    }
    if (languages) {
      for (const lang of languages) {
        tags.push(`lang-${lang.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }

    const companyResult = await createCompany({
      name: firmName,
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
        visaTypes?.length ? `Visa types: ${visaTypes.join(", ")}` : "",
        typeof caseVolume === "number" ? `Monthly case volume: ${caseVolume}` : "",
        languages?.length ? `Languages: ${languages.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "immigration-law",
      companyUid: companyResult.data?.uid,
      message: "Immigration law firm intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("immigration-law error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "immigration-law" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

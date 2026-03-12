import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";

type ChurchNeed = "member-portal" | "volunteer" | "donations" | "events";

interface ChurchManagementRequest {
  organizationName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  memberCount?: number;
  ministries?: string[];
  needs?: ChurchNeed[];
}

function memberRangeTag(count: number): string {
  if (count <= 100) return "members-1-100";
  if (count <= 500) return "members-101-500";
  if (count <= 2000) return "members-501-2000";
  return "members-2000-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ChurchManagementRequest>;

    const { organizationName, contactInfo, memberCount, ministries, needs } = body;

    if (!organizationName || !contactInfo?.firstName || !contactInfo?.lastName || !contactInfo?.email) {
      return NextResponse.json(
        { error: "organizationName and contactInfo (firstName, lastName, email) are required." },
        { status: 400 },
      );
    }

    const tags = ["church-management", "neatcircle"];
    if (needs) {
      for (const n of needs) {
        tags.push(`need-${n}`);
      }
    }
    if (typeof memberCount === "number") tags.push(memberRangeTag(memberCount));

    const companyResult = await createCompany({
      name: organizationName,
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
        typeof memberCount === "number" ? `Member count: ${memberCount}` : "",
        ministries?.length ? `Ministries: ${ministries.join(", ")}` : "",
        needs?.length ? `Needs: ${needs.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "church-management",
      companyUid: companyResult.data?.uid,
      message: "Church management intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("church-management error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "church-management" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

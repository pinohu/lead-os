import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

type TrainingType = "employee" | "client" | "certification" | "compliance";

interface TrainingPlatformRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  trainingType?: TrainingType;
  courseCount?: number;
  estimatedLearners?: number;
}

function learnerRangeTag(count: number): string {
  if (count <= 50) return "learners-1-50";
  if (count <= 200) return "learners-51-200";
  if (count <= 500) return "learners-201-500";
  return "learners-500-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TrainingPlatformRequest>;

    const {
      companyName, firstName, lastName, email, phone,
      trainingType, courseCount, estimatedLearners,
    } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["training-platform", serverSiteConfig.tenantSlug];
    if (trainingType) tags.push(trainingType);
    if (typeof estimatedLearners === "number") {
      tags.push(learnerRangeTag(estimatedLearners));
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
        trainingType ? `Training type: ${trainingType}` : "",
        typeof courseCount === "number" ? `Course count: ${courseCount}` : "",
        typeof estimatedLearners === "number" ? `Estimated learners: ${estimatedLearners}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "training-platform",
      companyUid: companyResult.data?.uid,
      message: "Training platform intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("training-platform error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "training-platform" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

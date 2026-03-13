import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface ProcessAutomationRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentProcesses?: string[];
  painPoints?: string[];
  estimatedManualHours?: number;
  targetTools?: string[];
}

function hoursRangeTag(hours: number): string {
  if (hours <= 10) return "hours-0-10";
  if (hours <= 40) return "hours-11-40";
  if (hours <= 100) return "hours-41-100";
  return "hours-100-plus";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ProcessAutomationRequest>;

    const {
      companyName, firstName, lastName, email, phone,
      currentProcesses, painPoints, estimatedManualHours, targetTools,
    } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["process-automation", serverSiteConfig.tenantSlug];
    if (targetTools) {
      for (const t of targetTools) {
        tags.push(t.toLowerCase().replace(/\s+/g, "-"));
      }
    }
    if (typeof estimatedManualHours === "number") {
      tags.push(hoursRangeTag(estimatedManualHours));
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
        currentProcesses?.length ? `Current processes: ${currentProcesses.join(", ")}` : "",
        painPoints?.length ? `Pain points: ${painPoints.join(", ")}` : "",
        typeof estimatedManualHours === "number" ? `Est. manual hours/week: ${estimatedManualHours}` : "",
        targetTools?.length ? `Target tools: ${targetTools.join(", ")}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "process-automation",
      companyUid: companyResult.data?.uid,
      message: "Process automation intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("process-automation error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "process-automation" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

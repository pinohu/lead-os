import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";

interface DigitalTransformationRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentState?: string;
  goals?: string[];
  timeline?: string;
  budgetRange?: string;
}

function budgetRangeTag(range: string): string {
  return `budget-${range.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DigitalTransformationRequest>;

    const {
      companyName, firstName, lastName, email, phone,
      currentState, goals, timeline, budgetRange,
    } = body;

    if (!companyName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "companyName, firstName, lastName, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["digital-transformation", "neatcircle"];
    if (goals) {
      for (const g of goals) {
        tags.push(g.toLowerCase().replace(/\s+/g, "-"));
      }
    }
    if (timeline) {
      tags.push(`timeline-${timeline.toLowerCase().replace(/\s+/g, "-")}`);
    }
    if (budgetRange) {
      tags.push(budgetRangeTag(budgetRange));
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
        currentState ? `Current state: ${currentState}` : "",
        goals?.length ? `Goals: ${goals.join(", ")}` : "",
        timeline ? `Timeline: ${timeline}` : "",
        budgetRange ? `Budget range: ${budgetRange}` : "",
      ].filter(Boolean).join("\n") || undefined,
    });

    return NextResponse.json({
      success: true,
      automation: "digital-transformation",
      companyUid: companyResult.data?.uid,
      message: "Digital transformation intake recorded in SuiteDash",
    });
  } catch (err) {
    console.error("digital-transformation error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "digital-transformation" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

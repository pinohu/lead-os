import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, company, phone, service, message } =
      body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required." },
        { status: 400 },
      );
    }

    const result = await processLeadIntake({
      source: "contact_form",
      firstName,
      lastName,
      email,
      company,
      phone,
      service,
      message,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("Contact API error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

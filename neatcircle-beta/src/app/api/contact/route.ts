import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";
import { getRequestIdentity, enforceRateLimit } from "@/lib/request-guards";

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIdentity(req);
    const rl = enforceRateLimit(`contact:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

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

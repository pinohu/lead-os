import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const result = await processLeadIntake({
      source: "newsletter",
      firstName,
      lastName: ".",
      email,
      service: "newsletter",
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("/api/subscribe error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";
import { enforceRateLimit, getRequestIdentity } from "@/lib/request-guards";

export async function POST(req: NextRequest) {
  try {
    const identity = getRequestIdentity(req);
    const rateLimit = enforceRateLimit(`subscribe:${identity}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
      );
    }

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
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";
import { getRequestIdentity, enforceRateLimit } from "@/lib/request-guards";

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIdentity(req);
    const rl = enforceRateLimit(`subscribe:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
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

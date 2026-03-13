import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake, type LeadIntakePayload } from "@/lib/lead-intake";
import { enforceRateLimit, getRequestIdentity, isPlainObject } from "@/lib/request-guards";

export async function POST(req: NextRequest) {
  try {
    const identity = getRequestIdentity(req);
    const rateLimit = enforceRateLimit(`intake:${identity}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many intake requests. Please slow down." },
        { status: 429 },
      );
    }

    const body = (await req.json()) as LeadIntakePayload;
    if (!isPlainObject(body)) {
      return NextResponse.json({ error: "Invalid intake payload" }, { status: 400 });
    }

    const result = await processLeadIntake(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid intake request" },
      { status: 400 },
    );
  }
}

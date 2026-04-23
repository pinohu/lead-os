import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";
import { validateSubscribeInput } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const check = validateSubscribeInput(body);

    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const result = await processLeadIntake({
      source: "newsletter",
      firstName: check.data.firstName,
      lastName: ".",
      email: check.data.email,
      service: "newsletter",
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

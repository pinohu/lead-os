import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake } from "@/lib/lead-intake";
import { validateContactInput } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const check = validateContactInput(body);

    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const result = await processLeadIntake({
      source: "contact_form",
      ...check.data,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("Contact API error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

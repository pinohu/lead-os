import { NextRequest, NextResponse } from "next/server";
import { processLeadIntake, type LeadIntakePayload } from "@/lib/lead-intake";
import { enforceRateLimit, getRequestIdentity, isPlainObject, isValidEmail } from "@/lib/request-guards";

const MAX_BODY_SIZE = 16_384;

const VALID_SOURCES = new Set([
  "contact_form", "assessment", "roi_calculator", "exit_intent",
  "chat", "whatsapp_optin", "newsletter", "manual",
]);

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const identity = getRequestIdentity(req);
    const rateLimit = enforceRateLimit(`intake:${identity}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many intake requests. Please slow down." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !isPlainObject(body)) {
      return NextResponse.json({ error: "Invalid intake payload" }, { status: 400 });
    }

    if (typeof body.source !== "string" || !VALID_SOURCES.has(body.source)) {
      return NextResponse.json({ error: "Invalid or missing source field" }, { status: 400 });
    }

    if (typeof body.email === "string" && !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const result = await processLeadIntake(body as unknown as LeadIntakePayload);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Invalid intake request" },
      { status: 400 },
    );
  }
}

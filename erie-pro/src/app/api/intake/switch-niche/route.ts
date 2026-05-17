// POST /api/intake/switch-niche
// Lets the customer change their niche routing after the problem step.
// Used by the "did you mean?" UI in the intake widget.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { switchNiche } from "@/lib/intake/conversation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const SwitchNicheSchema = z.object({
  conversationId: z.string().min(1).max(100),
  nicheSlug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "invalid niche slug"),
});

export async function POST(request: NextRequest) {
  // Rate-limit to discourage abuse (same envelope as the message endpoint)
  const rateLimited = await checkRateLimit(request, "lead-event");
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = SwitchNicheSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }

  try {
    const result = await switchNiche(
      parsed.data.conversationId,
      parsed.data.nicheSlug
    );
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg === "conversation-not-found" ||
      msg === "conversation-not-active" ||
      msg === "invalid-niche-slug" ||
      msg === "cannot-switch-before-problem-classified"
    ) {
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400 }
      );
    }
    logger.error("intake.switch-niche failed", { error: msg });
    return NextResponse.json(
      { success: false, error: "internal-error" },
      { status: 500 }
    );
  }
}

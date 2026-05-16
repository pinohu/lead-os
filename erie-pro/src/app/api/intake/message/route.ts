// POST /api/intake/message
// Advance an in-flight intake conversation one step.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { advanceConversation } from "@/lib/intake/conversation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sanitizeText, normalizePhone } from "@/lib/validation";

// Email schema (local — validation.ts emailSchema is private)
const emailField = z
  .string()
  .min(1, "Email is required")
  .max(254)
  .email("Invalid email")
  .transform((s) => s.trim().toLowerCase());

// Mirrors the IntakeMessageRequest type's payload union.
const PayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("problem"),
    text: z.string().min(3).max(2000).transform(sanitizeText),
  }),
  z.object({
    kind: z.literal("location"),
    zip: z.string().max(10).optional(),
  }),
  z.object({
    kind: z.literal("urgency"),
    urgency: z.enum(["emergency", "this-week", "researching"]),
  }),
  z.object({
    kind: z.literal("budget"),
    budget: z.enum(["under-500", "500-2k", "over-2k", "not-sure", "skipped"]),
  }),
  z.object({
    kind: z.literal("contact"),
    firstName: z.string().max(100).transform(sanitizeText).optional(),
    lastName: z.string().max(100).transform(sanitizeText).optional(),
    phone: z
      .string()
      .max(20)
      .transform((p) => (p ? normalizePhone(p) : p))
      .optional(),
    email: emailField,
    preference: z.enum(["phone", "sms", "email"]),
    tcpaConsent: z.boolean(),
  }),
]);

const MessageSchema = z.object({
  conversationId: z.string().min(1).max(100),
  forStep: z.enum(["problem", "location", "urgency", "budget", "contact"]),
  payload: PayloadSchema,
});

export async function POST(request: NextRequest) {
  // Rate-limit: 60/min/IP (reuse the lead-event preset which has that shape).
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

  const parsed = MessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }

  try {
    const result = await advanceConversation(parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg === "conversation-not-found" ||
      msg === "conversation-not-active" ||
      msg.startsWith("step-mismatch") ||
      msg === "problem-too-short" ||
      msg === "contact-validation-failed"
    ) {
      // Client-error cases — return 400 with the specific code
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400 }
      );
    }
    logger.error("intake.message failed", { error: msg });
    return NextResponse.json(
      { success: false, error: "internal-error" },
      { status: 500 }
    );
  }
}

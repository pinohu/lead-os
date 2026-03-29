import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional().default(""),
  inquiryType: z.enum(["sales", "support", "partnership", "other"]),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid contact form submission",
            details: parsed.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { name, email, company, inquiryType, message } = parsed.data;

    logger.info("Contact form submission received", {
      name,
      email,
      company,
      inquiryType,
      messageLength: message.length,
    });

    // In production with email provider configured, this would send an email.
    // For now, log the submission (dry-run mode).

    return NextResponse.json({
      data: { success: true, message: "Your message has been received. We will respond within 24 hours." },
      error: null,
    });
  } catch (err) {
    logger.error("Contact form submission failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Failed to process contact form" },
      },
      { status: 500 },
    );
  }
}

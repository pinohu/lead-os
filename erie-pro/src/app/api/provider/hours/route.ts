// ── Business Hours API ────────────────────────────────────────────────
// GET  /api/provider/hours — Return current business hours
// PATCH /api/provider/hours — Update business hours (Zod validated)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_BODY_SIZE } from "@/lib/validation";

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format");

const DayHoursSchema = z.union([
  z.object({
    open: TimeSchema,
    close: TimeSchema,
  }),
  z.object({ closed: z.literal(true) }),
]);

const BusinessHoursSchema = z.object({
  mon: DayHoursSchema.optional(),
  tue: DayHoursSchema.optional(),
  wed: DayHoursSchema.optional(),
  thu: DayHoursSchema.optional(),
  fri: DayHoursSchema.optional(),
  sat: DayHoursSchema.optional(),
  sun: DayHoursSchema.optional(),
});

const UpdateSchema = z.object({
  businessHours: BusinessHoursSchema,
  timezone: z.string().min(1).max(100).optional(),
});

async function getProviderFromSession() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.providerId) return null;

  return prisma.provider.findUnique({
    where: { id: user.providerId },
  });
}

export async function GET() {
  const provider = await getProviderFromSession();
  if (!provider) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      businessHours: provider.businessHours ?? null,
      timezone: provider.timezone,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const provider = await getProviderFromSession();
  if (!provider) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      { success: false, error: "Request body too large" },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { businessHours, timezone } = parsed.data;

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      businessHours: JSON.parse(JSON.stringify(businessHours)),
      ...(timezone ? { timezone } : {}),
    },
  });

  return NextResponse.json({ success: true });
}

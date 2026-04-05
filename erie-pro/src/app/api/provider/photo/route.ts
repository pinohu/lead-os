// ── Provider Photo Upload API ─────────────────────────────────────────
// POST /api/provider/photo — Upload a profile photo
// Accepts multipart/form-data with an image file (max 1MB).
// Stores as base64 data URL in the database.
// TODO: Migrate to object storage (S3/R2) for production — base64 in
// PostgreSQL is a DoS vector and degrades query performance.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB (reduced from 5MB to limit DB bloat)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.providerId) {
    return NextResponse.json(
      { success: false, error: "No provider linked to this account" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No photo file provided" },
      { status: 400 }
    );
  }

  // Validate content type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF`,
      },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 1MB`,
      },
      { status: 400 }
    );
  }

  try {
    // Convert to base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update provider
    await prisma.provider.update({
      where: { id: user.providerId },
      data: { photoUrl: dataUrl },
    });

    return NextResponse.json({
      success: true,
      data: { photoUrl: dataUrl },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

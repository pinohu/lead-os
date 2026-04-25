// ── Provider Photo Upload API ─────────────────────────────────────────
// POST /api/provider/photo — Upload a profile photo
// Accepts multipart/form-data with an image file (max 5MB).
// Stores as base64 data URL in the database.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { SUPPORTED_IMAGE_TYPES, verifyImageUpload } from "@/lib/image-signature";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  // Quick reject on client-reported type so we don't even read the bytes
  // of an obviously wrong upload.
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
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
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 5MB`,
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Defense-in-depth: client-declared Content-Type can lie. Verify the
    // magic bytes actually match an accepted image format. Without this
    // check, an attacker could upload HTML/SVG-with-<script> or a polyglot
    // with an `image/jpeg` Content-Type and we'd happily store it.
    const verified = verifyImageUpload(buffer, file.type);
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: verified.reason },
        { status: 400 }
      );
    }

    // Use the verified MIME type (never the client-claimed one) in the
    // data URL so the rendered Content-Type always matches the content.
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${verified.mime};base64,${base64}`;

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

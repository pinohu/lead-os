// ── Provider Photo Upload API ─────────────────────────────────────────
// POST /api/provider/photo — Upload a profile photo
// Accepts multipart/form-data with an image file (max 2MB).
//
// ⚠️  Known limitation: stores images as base64 data URLs in the database.
// This works for small images but bloats row size. The 2MB cap mitigates
// the worst cases, but a proper solution would use object storage.
//
// TODO: Migrate photo storage to S3, Cloudflare R2, or Supabase Storage.
//       Store only the object URL in `photoUrl` and serve via CDN.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB — kept small to limit DB bloat (base64 storage)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Magic-byte signatures for allowed image types */
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [], // checked separately: bytes 8-11 = "WEBP"
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    // RIFF....WEBP
    return buffer.length >= 12 && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures || signatures.length === 0) return true;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}

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
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 2MB`,
      },
      { status: 400 }
    );
  }

  try {
    // Convert to base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify magic bytes match the claimed MIME type
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "File content does not match its declared type",
        },
        { status: 400 }
      );
    }

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

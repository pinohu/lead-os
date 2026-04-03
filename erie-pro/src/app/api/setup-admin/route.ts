// ── Admin Bootstrap API ─────────────────────────────────────────────
// One-time endpoint to create the first admin user.
// Returns 403 if any admin user already exists.

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";

const SetupSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  name: z
    .string()
    .max(200, "Name too long")
    .optional(),
});

export async function POST(request: Request) {
  try {
    // ── Guard: check if admin already exists ──────────────────────────
    const adminCount = await prisma.user.count({
      where: { role: "admin" },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Admin already configured. Setup is disabled." },
        { status: 403 }
      );
    }

    // ── Parse & validate input ───────────────────────────────────────
    const body = await request.json();
    const parsed = SetupSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const displayName = name || "Admin";

    // ── Hash password (bcrypt, 12 rounds — matches create-admin.ts) ──
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Create Provider record for password auth ─────────────────────
    const adminSlug = `admin-${email.split("@")[0]}`;

    const provider = await prisma.provider.create({
      data: {
        slug: adminSlug,
        businessName: `${displayName} (Admin)`,
        niche: "admin",
        phone: "0000000000",
        email,
        passwordHash,
      },
    });

    // ── Create or update User with admin role ────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { email },
        data: {
          role: "admin",
          providerId: provider.id,
          name: displayName,
          emailVerified: new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          role: "admin",
          providerId: provider.id,
          emailVerified: new Date(),
        },
      });
    }

    // ── Audit log ────────────────────────────────────────────────────
    await audit({
      action: "admin.action",
      entityType: "provider",
      entityId: provider.id,
      providerId: provider.id,
      metadata: {
        description: "First admin account created via bootstrap setup",
        userId: user.id,
        email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully.",
    });
  } catch (err) {
    console.error("Admin setup error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

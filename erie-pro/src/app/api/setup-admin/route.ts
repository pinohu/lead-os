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
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = SetupSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const displayName = name || "Admin";
    const passwordHash = await bcrypt.hash(password, 12);
    const adminSlug = `admin-${email.split("@")[0]}`;

    const result = await prisma.$transaction(async (tx) => {
      const adminCount = await tx.user.count({ where: { role: "admin" } });
      if (adminCount > 0) {
        return { error: "Admin already configured. Setup is disabled." } as const;
      }

      const provider = await tx.provider.create({
        data: {
          slug: adminSlug,
          businessName: `${displayName} (Admin)`,
          niche: "admin",
          phone: "0000000000",
          email,
          passwordHash,
        },
      });

      const existingUser = await tx.user.findUnique({ where: { email } });

      const user = existingUser
        ? await tx.user.update({
            where: { email },
            data: { role: "admin", providerId: provider.id, name: displayName, emailVerified: new Date() },
          })
        : await tx.user.create({
            data: { email, name: displayName, role: "admin", providerId: provider.id, emailVerified: new Date() },
          });

      return { provider, user } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    await audit({
      action: "admin.action",
      entityType: "provider",
      entityId: result.provider.id,
      providerId: result.provider.id,
      metadata: {
        description: "First admin account created via bootstrap setup",
        userId: result.user.id,
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

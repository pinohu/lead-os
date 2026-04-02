/**
 * Create Admin User
 * -----------------
 * Creates an admin user with a linked provider profile for password auth.
 * Run: npx tsx src/scripts/create-admin.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("\n🔐 Erie Pro — Create Admin User\n");

  const email = await ask("   Admin email: ");
  if (!email.includes("@")) {
    console.error("   ❌ Invalid email");
    process.exit(1);
  }

  const password = await ask("   Password (min 8 chars): ");
  if (password.length < 8) {
    console.error("   ❌ Password must be at least 8 characters");
    process.exit(1);
  }

  const name = await ask("   Display name (or press Enter for 'Admin'): ");
  const displayName = name || "Admin";

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`\n   ⚠️  User ${email} already exists (id: ${existing.id})`);
    const update = await ask("   Update to admin role with new password? (y/n): ");
    if (update.toLowerCase() === "y") {
      const passwordHash = await bcrypt.hash(password, 12);

      if (existing.providerId) {
        // Update existing linked provider
        await prisma.provider.update({
          where: { id: existing.providerId },
          data: { passwordHash },
        });
      } else {
        // Create a provider profile for password auth
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
        await prisma.user.update({
          where: { email },
          data: { role: "admin", providerId: provider.id },
        });
      }

      await prisma.user.update({
        where: { email },
        data: { role: "admin" },
      });
      console.log("   ✅ Updated to admin role with new password");
    }
    rl.close();
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create a provider profile to store the password hash
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

  // Create the admin user linked to the provider
  const user = await prisma.user.create({
    data: {
      email,
      name: displayName,
      role: "admin",
      providerId: provider.id,
      emailVerified: new Date(),
    },
  });

  console.log(`\n   ✅ Admin user created!`);
  console.log(`      ID: ${user.id}`);
  console.log(`      Email: ${user.email}`);
  console.log(`      Role: admin`);
  console.log(`\n   Login at: https://erie.pro/login\n`);

  rl.close();
}

main()
  .catch((err) => {
    console.error("Error:", err);
    rl.close();
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

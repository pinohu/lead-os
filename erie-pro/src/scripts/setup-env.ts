/**
 * Interactive Environment Setup Script
 * ─────────────────────────────────────
 * Walks through configuring .env.local with all required service keys.
 * Run: npx tsx src/scripts/setup-env.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const ENV_FILE = path.resolve(process.cwd(), ".env.local");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function readEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE)) return {};
  const lines = fs.readFileSync(ENV_FILE, "utf-8").split("\n");
  const env: Record<string, string> = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)="(.*)"/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function setEnvVar(key: string, value: string) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf-8") : "";
  const regex = new RegExp(`^${key}=".*"$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}="${value}"`);
  } else {
    content += `\n${key}="${value}"`;
  }
  fs.writeFileSync(ENV_FILE, content.trimEnd() + "\n");
}

async function main() {
  console.log("\n🔧 Erie Pro — Environment Setup\n");
  console.log(`   Editing: ${ENV_FILE}\n`);

  const env = readEnv();

  // ── Database ──────────────────────────────────────────────────
  if (env.DATABASE_URL) {
    console.log("✅ DATABASE_URL is set (Neon/Vercel Postgres)");
  } else {
    console.log("❌ DATABASE_URL is missing. Run 'vercel install neon' first.");
  }

  // ── Stripe ────────────────────────────────────────────────────
  console.log("\n── Stripe ──────────────────────────────────────");
  if (env.STRIPE_SECRET_KEY) {
    const mode = env.STRIPE_SECRET_KEY.startsWith("sk_live") ? "LIVE 🔴" : "TEST 🧪";
    console.log(`✅ STRIPE_SECRET_KEY is set (${mode})`);
  } else {
    const key = await ask("   Stripe Secret Key (sk_live_... or sk_test_...): ");
    if (key.trim()) {
      setEnvVar("STRIPE_SECRET_KEY", key.trim());
      console.log("   ✅ Saved");
    } else {
      console.log("   ⏭️  Skipped (dry-run mode)");
    }
  }

  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    const key = await ask("   Stripe Publishable Key (pk_live_... or pk_test_...): ");
    if (key.trim()) {
      setEnvVar("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", key.trim());
      console.log("   ✅ Saved");
    } else {
      console.log("   ⏭️  Skipped");
    }
  } else {
    console.log("✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set");
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.log("   ℹ️  STRIPE_WEBHOOK_SECRET: Set this after running 'stripe listen'");
    console.log("   Or add your production webhook secret from Stripe dashboard.");
    const key = await ask("   Stripe Webhook Secret (whsec_... or press Enter to skip): ");
    if (key.trim()) {
      setEnvVar("STRIPE_WEBHOOK_SECRET", key.trim());
      console.log("   ✅ Saved");
    }
  } else {
    console.log("✅ STRIPE_WEBHOOK_SECRET is set");
  }

  // ── Emailit ───────────────────────────────────────────────────
  console.log("\n── Emailit ─────────────────────────────────────");
  if (env.EMAILIT_API_KEY) {
    console.log("✅ EMAILIT_API_KEY is set");
  } else {
    const key = await ask("   Emailit API Key (from emailit.com dashboard): ");
    if (key.trim()) {
      setEnvVar("EMAILIT_API_KEY", key.trim());
      console.log("   ✅ Saved");
    } else {
      console.log("   ⏭️  Skipped (emails will log to console)");
    }
  }

  // ── Auth ──────────────────────────────────────────────────────
  console.log("\n── Auth ────────────────────────────────────────");
  if (env.AUTH_SECRET) {
    console.log("✅ AUTH_SECRET is set");
  } else {
    const { randomBytes } = await import("crypto");
    const secret = randomBytes(32).toString("hex");
    setEnvVar("AUTH_SECRET", secret);
    console.log("✅ AUTH_SECRET generated and saved");
  }

  // ── Admin ─────────────────────────────────────────────────────
  console.log("\n── Admin ───────────────────────────────────────");
  if (env.ADMIN_ACCESS_KEY) {
    console.log("✅ ADMIN_ACCESS_KEY is set");
  } else {
    const key = await ask("   Admin Access Key (min 8 chars, or press Enter to generate): ");
    if (key.trim()) {
      setEnvVar("ADMIN_ACCESS_KEY", key.trim());
    } else {
      const { randomBytes } = await import("crypto");
      const generated = randomBytes(16).toString("hex");
      setEnvVar("ADMIN_ACCESS_KEY", generated);
      console.log(`   ✅ Generated: ${generated}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────
  const finalEnv = readEnv();
  console.log("\n═══════════════════════════════════════════════");
  console.log("📋 Environment Summary:");
  console.log(`   DATABASE_URL:            ${finalEnv.DATABASE_URL ? "✅" : "❌"}`);
  console.log(`   STRIPE_SECRET_KEY:       ${finalEnv.STRIPE_SECRET_KEY ? "✅" : "⏭️ dry-run"}`);
  console.log(`   STRIPE_PUBLISHABLE_KEY:  ${finalEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅" : "⏭️ dry-run"}`);
  console.log(`   STRIPE_WEBHOOK_SECRET:   ${finalEnv.STRIPE_WEBHOOK_SECRET ? "✅" : "⏭️ (add later)"}`);
  console.log(`   EMAILIT_API_KEY:         ${finalEnv.EMAILIT_API_KEY ? "✅" : "⏭️ dry-run"}`);
  console.log(`   AUTH_SECRET:             ${finalEnv.AUTH_SECRET ? "✅" : "❌"}`);
  console.log(`   ADMIN_ACCESS_KEY:        ${finalEnv.ADMIN_ACCESS_KEY ? "✅" : "❌"}`);
  console.log("═══════════════════════════════════════════════");

  if (finalEnv.STRIPE_SECRET_KEY) {
    console.log("\n🎯 Next steps:");
    console.log("   1. Run: npx tsx src/scripts/stripe-setup.ts");
    console.log("      (Creates 44 products + 136 prices in Stripe)");
    console.log("   2. For local webhook testing:");
    console.log("      stripe listen --forward-to localhost:3002/api/webhooks/stripe");
    console.log("   3. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET");
  }

  if (finalEnv.EMAILIT_API_KEY) {
    console.log("\n📧 Email setup:");
    console.log("   Verify erie.pro domain in Emailit dashboard");
    console.log("   Add DNS records: SPF, DKIM, DMARC");
  }

  console.log("\n🚀 Start development: npm run dev\n");

  rl.close();
}

main().catch((err) => {
  console.error("Error:", err);
  rl.close();
  process.exit(1);
});

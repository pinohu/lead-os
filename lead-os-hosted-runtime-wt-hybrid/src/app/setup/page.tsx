import type { Metadata } from "next";
import type { EnvCheck, NicheOption, InitialConfig, SetupStatus } from "@/components/SetupWizardClient";
import { SetupWizardClient } from "@/components/SetupWizardClient";
import { tenantConfig } from "@/lib/tenant";
import { nicheCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Setup — Lead OS",
  description: "First-run setup wizard for your Lead OS instance. Configure brand, environment, and integrations.",
};

// ---------------------------------------------------------------------------
// Environment checks — describes every variable the wizard surfaces
// ---------------------------------------------------------------------------

interface EnvCheckDescriptor {
  key: string;
  label: string;
  description: string;
  envVar: string;
  optional: boolean;
}

const ENV_CHECK_DESCRIPTORS: EnvCheckDescriptor[] = [
  {
    key: "database",
    label: "Database (PostgreSQL)",
    description:
      "Required to persist leads, sessions, and automation state across restarts. Set DATABASE_URL to a valid PostgreSQL connection string.",
    envVar: "DATABASE_URL",
    optional: false,
  },
  {
    key: "tenant",
    label: "Tenant identity",
    description:
      "A unique identifier for this installation. Set LEAD_OS_TENANT_ID to a value other than the default placeholder.",
    envVar: "LEAD_OS_TENANT_ID",
    optional: false,
  },
  {
    key: "ai",
    label: "AI provider",
    description:
      "Powers lead scoring, AI copywriting, and chat agents. Set OPENAI_API_KEY or ANTHROPIC_API_KEY. Without this, AI features run in dry-run mode.",
    envVar: "OPENAI_API_KEY",
    optional: true,
  },
  {
    key: "email",
    label: "Email provider",
    description:
      "Required to send lead notifications and nurture sequences. Set EMAILIT_API_KEY or SINOSEND_API_KEY. Without this, emails are logged but not sent.",
    envVar: "EMAILIT_API_KEY",
    optional: true,
  },
  {
    key: "billing",
    label: "Billing (Stripe)",
    description:
      "Required to accept payments and manage subscriptions. Set STRIPE_SECRET_KEY. Without this, checkout flows run in test mode only.",
    envVar: "STRIPE_SECRET_KEY",
    optional: true,
  },
  {
    key: "encryption",
    label: "Credentials encryption key",
    description:
      "Required in production to encrypt stored provider credentials. Set CREDENTIALS_ENCRYPTION_KEY to a 32-byte hex string. A dev-only key is derived automatically in non-production environments.",
    envVar: "CREDENTIALS_ENCRYPTION_KEY",
    optional: false,
  },
];

function buildEnvChecks(): EnvCheck[] {
  return ENV_CHECK_DESCRIPTORS.map((descriptor) => {
    // Special-case the AI provider — either OpenAI or Anthropic counts
    if (descriptor.key === "ai") {
      const present =
        Boolean(process.env.OPENAI_API_KEY?.trim()) ||
        Boolean(process.env.ANTHROPIC_API_KEY?.trim());
      return { key: descriptor.envVar, label: descriptor.label, description: descriptor.description, present, optional: descriptor.optional };
    }

    // Special-case the email provider — any of the supported keys counts
    if (descriptor.key === "email") {
      const present =
        Boolean(process.env.EMAILIT_API_KEY?.trim()) ||
        Boolean(process.env.SINOSEND_API_KEY?.trim());
      return { key: descriptor.envVar, label: descriptor.label, description: descriptor.description, present, optional: descriptor.optional };
    }

    // Special-case tenant — must differ from the default placeholder
    if (descriptor.key === "tenant") {
      const tenantId = process.env.LEAD_OS_TENANT_ID;
      const present = Boolean(tenantId) && tenantId !== "default-tenant";
      return { key: descriptor.envVar, label: descriptor.label, description: descriptor.description, present, optional: descriptor.optional };
    }

    const rawValue = process.env[descriptor.envVar];
    const present = Boolean(rawValue?.trim());
    return {
      key: descriptor.envVar,
      label: descriptor.label,
      description: descriptor.description,
      present,
      optional: descriptor.optional,
    };
  });
}

// ---------------------------------------------------------------------------
// Database connectivity check
// ---------------------------------------------------------------------------

async function checkDatabase(): Promise<boolean> {
  try {
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    if (!pool) return false;
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Derive the full setup status
// ---------------------------------------------------------------------------

async function buildSetupStatus(): Promise<SetupStatus> {
  const database = await checkDatabase();

  const tenantId = process.env.LEAD_OS_TENANT_ID;
  const tenant = Boolean(tenantId) && tenantId !== "default-tenant";

  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;
  const brand =
    Boolean(brandName) &&
    brandName !== "My Brand" &&
    brandName !== "Lead OS Hosted";

  return {
    database,
    tenant,
    brand,
    configured: database && tenant && brand,
  };
}

// ---------------------------------------------------------------------------
// Build the niche options list from the catalog
// ---------------------------------------------------------------------------

function buildNicheOptions(): NicheOption[] {
  return Object.values(nicheCatalog).map((niche) => ({
    slug: niche.slug,
    label: niche.label,
    summary: niche.summary,
  }));
}

// ---------------------------------------------------------------------------
// Page — server component
// ---------------------------------------------------------------------------

export default async function SetupPage() {
  const [setupStatus, envChecks, niches] = await Promise.all([
    buildSetupStatus(),
    Promise.resolve(buildEnvChecks()),
    Promise.resolve(buildNicheOptions()),
  ]);

  const initialConfig: InitialConfig = {
    brandName: tenantConfig.brandName,
    supportEmail: tenantConfig.supportEmail,
    defaultNiche: tenantConfig.defaultNiche,
    accent: tenantConfig.accent,
    siteUrl: tenantConfig.siteUrl,
    tenantId: tenantConfig.tenantId,
  };

  return (
    <SetupWizardClient
      envChecks={envChecks}
      niches={niches}
      initialConfig={initialConfig}
      setupStatus={setupStatus}
    />
  );
}

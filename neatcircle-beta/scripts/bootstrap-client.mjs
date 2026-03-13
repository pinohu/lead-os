import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");

const presets = {
  neatcircle: {
    brandName: "NeatCircle",
    secondaryBrandName: "Your Deputy",
    legalName: "NeatCircle LLC",
    brandPrimary: "Neat",
    brandAccent: "Circle",
    siteUrl: "https://neatcircle.com",
    supportEmail: "services@neatcircle.com",
    adminEmail: "ike@neatcircle.com",
    tenantTag: "neatcircle",
    portalUrl: "https://portal.yourdeputy.com",
    marketingHeadline: "Business Automation & Process Optimization",
    marketingDescription: "Systematic process optimization and operational efficiency solutions for middle-market companies.",
    enabledServices: "client-portal,process-automation,systems-integration,training-platform,business-intelligence,digital-transformation,compliance-training,managed-services,re-syndication,immigration-law,construction,franchise,staffing,church-management,creator-management,compliance-productized",
    featuredCore: "client-portal,process-automation,systems-integration,training-platform",
    featuredBlueOcean: "re-syndication,immigration-law,construction,franchise",
    featuredIndustries: "client-portal,process-automation,business-intelligence,managed-services,re-syndication,immigration-law",
  },
  "professional-services": {
    brandName: "Professional Services OS",
    secondaryBrandName: "Operator Desk",
    legalName: "Professional Services OS",
    brandPrimary: "Professional",
    brandAccent: "OS",
    siteUrl: "https://professional-services.example.com",
    supportEmail: "hello@professional-services.example.com",
    adminEmail: "ops@professional-services.example.com",
    tenantTag: "professional-services",
    portalUrl: "https://portal.professional-services.example.com",
    marketingHeadline: "Adaptive Lead Capture for High-Ticket Service Firms",
    marketingDescription: "Assessments, webinars, AI chat, and pipeline automation for agencies, consultancies, and service operators.",
    enabledServices: "client-portal,process-automation,systems-integration,business-intelligence,digital-transformation,managed-services,construction,franchise,staffing,creator-management",
    featuredCore: "client-portal,process-automation,systems-integration,business-intelligence",
    featuredBlueOcean: "construction,franchise,staffing,creator-management",
    featuredIndustries: "client-portal,construction,franchise,staffing,creator-management,business-intelligence",
  },
  "education-compliance": {
    brandName: "Training Growth OS",
    secondaryBrandName: "Enablement Desk",
    legalName: "Training Growth OS",
    brandPrimary: "Training",
    brandAccent: "Growth",
    siteUrl: "https://training-growth.example.com",
    supportEmail: "hello@training-growth.example.com",
    adminEmail: "ops@training-growth.example.com",
    tenantTag: "training-growth",
    portalUrl: "https://portal.training-growth.example.com",
    marketingHeadline: "Compliance, LMS, and Enablement Funnels That Convert",
    marketingDescription: "Turn knowledge delivery into a product with assessments, webinars, certificates, and automated intake.",
    enabledServices: "training-platform,compliance-training,compliance-productized,business-intelligence,managed-services,church-management",
    featuredCore: "training-platform,compliance-training,business-intelligence,managed-services",
    featuredBlueOcean: "compliance-productized,church-management",
    featuredIndustries: "training-platform,compliance-training,compliance-productized,church-management,business-intelligence,managed-services",
  },
  "dtc-conversion": {
    brandName: "DTC Conversion OS",
    secondaryBrandName: "Revenue Desk",
    legalName: "DTC Conversion OS",
    brandPrimary: "DTC",
    brandAccent: "OS",
    siteUrl: "https://dtc-conversion.example.com",
    supportEmail: "hello@dtc-conversion.example.com",
    adminEmail: "ops@dtc-conversion.example.com",
    tenantTag: "dtc-conversion",
    portalUrl: "https://portal.dtc-conversion.example.com",
    marketingHeadline: "Adaptive Acquisition for Offers With Faster Buying Cycles",
    marketingDescription: "Giveaways, coupon paths, evergreen proof, and recovery flows for conversion-focused operators.",
    enabledServices: "process-automation,systems-integration,business-intelligence,managed-services,creator-management",
    featuredCore: "process-automation,systems-integration,business-intelligence,managed-services",
    featuredBlueOcean: "creator-management",
    featuredIndustries: "process-automation,systems-integration,business-intelligence,managed-services,creator-management",
  },
};

const args = process.argv.slice(2);
const readArg = (name, fallback = "") => {
  const direct = args.find((arg) => arg.startsWith(`--${name}=`));
  if (direct) return direct.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
};

const presetId = readArg("preset", "neatcircle");
const tenant = readArg("tenant", presetId);
const preset = presets[presetId];

if (!preset) {
  console.error(`Unknown preset "${presetId}". Available: ${Object.keys(presets).join(", ")}`);
  process.exit(1);
}

const outputDir = resolve(projectRoot, "generated-clients");
const outputPath = resolve(outputDir, `${tenant}.env.example`);

const envTemplate = `# Generated client bootstrap for ${tenant}
NEXT_PUBLIC_TENANT_PRESET=${presetId}
TENANT_PRESET=${presetId}

NEXT_PUBLIC_BRAND_NAME=${preset.brandName}
NEXT_PUBLIC_SECONDARY_BRAND_NAME=${preset.secondaryBrandName}
NEXT_PUBLIC_LEGAL_NAME=${preset.legalName}
NEXT_PUBLIC_BRAND_PRIMARY=${preset.brandPrimary}
NEXT_PUBLIC_BRAND_ACCENT=${preset.brandAccent}
NEXT_PUBLIC_SITE_URL=${preset.siteUrl}
NEXT_PUBLIC_SUPPORT_EMAIL=${preset.supportEmail}
ADMIN_EMAIL=${preset.adminEmail}
TENANT_TAG=${preset.tenantTag}
NEXT_PUBLIC_PORTAL_URL=${preset.portalUrl}
NEXT_PUBLIC_MARKETING_HEADLINE=${preset.marketingHeadline}
NEXT_PUBLIC_MARKETING_DESCRIPTION=${preset.marketingDescription}
NEXT_PUBLIC_ENABLED_SERVICES=${preset.enabledServices}
NEXT_PUBLIC_FEATURED_CORE_SERVICES=${preset.featuredCore}
NEXT_PUBLIC_FEATURED_BLUE_OCEAN_SERVICES=${preset.featuredBlueOcean}
NEXT_PUBLIC_FEATURED_INDUSTRIES=${preset.featuredIndustries}

# Fill these before deployment
AUTOMATION_API_SECRET=
CRON_SECRET=
DASHBOARD_SECRET=
FROM_EMAIL=
AITABLE_API_TOKEN=
AITABLE_DATASHEET_ID=
EMAILIT_API_KEY=
SUITEDASH_PUBLIC_ID=
SUITEDASH_SECRET_KEY=
DISCORD_NEW_LEADS_WEBHOOK=
DISCORD_ERRORS_WEBHOOK=
DISCORD_HIGH_VALUE_WEBHOOK=
TELEGRAM_BOT_TOKEN=
TELEGRAM_NEW_LEADS_CHAT=
TELEGRAM_HIGH_VALUE_CHAT=
WBIZTOOL_API_KEY=
WBIZTOOL_INSTANCE_ID=
STRIPE_SECRET_KEY=
`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, envTemplate, "utf8");

console.log(`Generated ${outputPath}`);

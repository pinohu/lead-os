import { clientPresets, defaultClientPresetId } from "@/lib/client-presets";

const defaultSiteUrl = "https://neatcircle.com";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toDomain(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "");
  }
}

function toTag(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function splitCsv(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const presetId =
  process.env.NEXT_PUBLIC_TENANT_PRESET ??
  process.env.TENANT_PRESET ??
  defaultClientPresetId;

const preset = clientPresets[presetId] ?? clientPresets[defaultClientPresetId];

const enabledServices =
  splitCsv(process.env.NEXT_PUBLIC_ENABLED_SERVICES).length > 0
    ? splitCsv(process.env.NEXT_PUBLIC_ENABLED_SERVICES)
    : preset.enabledServices;

export const siteConfig = {
  presetId: preset.id,
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? preset.brandName,
  secondaryBrandName: process.env.NEXT_PUBLIC_SECONDARY_BRAND_NAME ?? preset.secondaryBrandName,
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? preset.legalName,
  brandPrimary: process.env.NEXT_PUBLIC_BRAND_PRIMARY ?? preset.brandPrimary,
  brandAccent: process.env.NEXT_PUBLIC_BRAND_ACCENT ?? preset.brandAccent,
  siteUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? preset.siteUrl ?? defaultSiteUrl),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? preset.supportEmail,
  adminEmail: process.env.ADMIN_EMAIL ?? preset.adminEmail,
  tenantTag: process.env.TENANT_TAG ?? preset.tenantTag,
  portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? preset.portalUrl,
  marketingHeadline:
    process.env.NEXT_PUBLIC_MARKETING_HEADLINE ?? preset.marketingHeadline,
  marketingDescription:
    process.env.NEXT_PUBLIC_MARKETING_DESCRIPTION ?? preset.marketingDescription,
  openGraphDescription:
    process.env.NEXT_PUBLIC_OPEN_GRAPH_DESCRIPTION ?? preset.openGraphDescription,
  activeServiceSlugs: enabledServices,
  featuredCoreServiceSlugs:
    splitCsv(process.env.NEXT_PUBLIC_FEATURED_CORE_SERVICES).length > 0
      ? splitCsv(process.env.NEXT_PUBLIC_FEATURED_CORE_SERVICES)
      : preset.featuredCoreServices,
  featuredBlueOceanServiceSlugs:
    splitCsv(process.env.NEXT_PUBLIC_FEATURED_BLUE_OCEAN_SERVICES).length > 0
      ? splitCsv(process.env.NEXT_PUBLIC_FEATURED_BLUE_OCEAN_SERVICES)
      : preset.featuredBlueOceanServices,
  featuredIndustrySlugs:
    splitCsv(process.env.NEXT_PUBLIC_FEATURED_INDUSTRIES).length > 0
      ? splitCsv(process.env.NEXT_PUBLIC_FEATURED_INDUSTRIES)
      : preset.featuredIndustries,
};

export const serverSiteConfig = {
  ...siteConfig,
  siteDomain: toDomain(siteConfig.siteUrl),
  fromEmail: process.env.FROM_EMAIL ?? `automations@${toDomain(siteConfig.siteUrl)}`,
  tenantSlug: toTag(siteConfig.tenantTag || siteConfig.brandName),
};

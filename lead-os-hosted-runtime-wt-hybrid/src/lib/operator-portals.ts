import {
  getProvisionablePackage,
  provisionablePackages,
  type PackageSlug,
  type ProvisionablePackage,
} from "./package-catalog.ts";

export interface OperatorPortal {
  slug: string;
  brandName: string;
  legalName: string;
  tagline: string;
  siteUrl: string;
  supportEmail: string;
  accent: string;
  primaryAudience: string;
  promise: string;
  proofPoints: string[];
  subscribedPackageSlugs: PackageSlug[];
  defaultSelectedSlugs: PackageSlug[];
  marketFocus: string[];
  portalNotes: string[];
}

const allPackageSlugs = provisionablePackages.map((pkg) => pkg.slug);

export const operatorPortals: OperatorPortal[] = [
  {
    slug: "northstar-growth",
    brandName: "Northstar Growth",
    legalName: "Northstar Growth Studio",
    tagline: "Outcome systems for operators who want revenue, speed, and proof without managing software.",
    siteUrl: "https://northstargrowth.example",
    supportEmail: "delivery@northstargrowth.example",
    accent: "#635bff",
    primaryAudience:
      "Local service businesses, expert-led companies, ecommerce teams, and operators that want finished growth systems instead of software projects.",
    promise:
      "Clients submit one guided intake and receive launched service hubs, customer-ready outputs, implementation guides, and acceptance checks under the Northstar Growth brand.",
    proofPoints: [
      "Every subscribed service can be sold alone or bundled with the others.",
      "One intake form supplies shared context for every selected service.",
      "Optional CRM, calendar, phone, billing, social, and webhook access use managed handoffs until approved account access is connected.",
      "Customers receive delivery hubs and plain-language guides, not tools they must configure themselves.",
    ],
    subscribedPackageSlugs: allPackageSlugs,
    defaultSelectedSlugs: [
      "ai-opportunity-audit",
      "ai-receptionist-missed-call-recovery",
      "lead-reactivation-engine",
      "content-repurposing-engine",
    ],
    marketFocus: ["med spas", "home services", "B2B experts", "ecommerce brands", "agencies"],
    portalNotes: [
      "Use this demo portal as the full catalog example for an operator subscribed to every service.",
      "Customer-facing pages intentionally do not mention the upstream fulfillment platform.",
    ],
  },
  {
    slug: "erie-demand-studio",
    brandName: "Erie Demand Studio",
    legalName: "Erie Demand Studio",
    tagline: "Local demand capture, reactivation, and directory monetization for regional operators.",
    siteUrl: "https://eriedemand.example",
    supportEmail: "support@eriedemand.example",
    accent: "#0f766e",
    primaryAudience:
      "Regional business owners, local directories, med spas, home-service companies, and marketplace operators that need routed demand and visible revenue proof.",
    promise:
      "Clients choose a local-growth solution, submit one intake, and receive a branded delivery hub with capture, routing, reporting, and operating instructions.",
    proofPoints: [
      "Local-service and directory offers can be deployed independently or as one regional revenue system.",
      "Shared intake fields prevent repeat onboarding when a customer adds another package.",
      "Every deliverable includes directions, workflows, acceptance checks, and failure-state handling.",
    ],
    subscribedPackageSlugs: [
      "ai-opportunity-audit",
      "ai-receptionist-missed-call-recovery",
      "lead-reactivation-engine",
      "speed-to-lead-system",
      "med-spa-growth-engine",
      "local-service-lead-engine",
      "directory-monetization-system",
      "revenue-attribution-suite",
    ],
    defaultSelectedSlugs: ["local-service-lead-engine", "directory-monetization-system", "revenue-attribution-suite"],
    marketFocus: ["Erie service businesses", "regional directories", "med spas", "home services"],
    portalNotes: [
      "Use this portal as a narrower subscription example for operators selling regional directory and local-demand systems.",
    ],
  },
];

export function getOperatorPortal(slug: string): OperatorPortal | undefined {
  return operatorPortals.find((portal) => portal.slug === slug);
}

export function getPortalPackages(portal: OperatorPortal): ProvisionablePackage[] {
  const subscribed = new Set(portal.subscribedPackageSlugs);
  return provisionablePackages.filter((pkg) => subscribed.has(pkg.slug));
}

export function getPortalPackage(portal: OperatorPortal, packageSlug: string): ProvisionablePackage | undefined {
  if (!portal.subscribedPackageSlugs.includes(packageSlug as PackageSlug)) return undefined;
  return getProvisionablePackage(packageSlug);
}

export function isPackageSubscribed(portal: OperatorPortal, packageSlug: string): packageSlug is PackageSlug {
  return portal.subscribedPackageSlugs.includes(packageSlug as PackageSlug);
}

export function getPortalHomePath(portal: OperatorPortal): string {
  return `/portal/${portal.slug}`;
}

export function getPortalPackagePath(portal: OperatorPortal, packageSlug: PackageSlug): string {
  return `${getPortalHomePath(portal)}/packages/${packageSlug}`;
}

export function getPortalWorkspacePath(
  portal: OperatorPortal,
  packageSlug: PackageSlug,
  workspaceSlug: string,
  surface?: string,
): string {
  const base = `${getPortalPackagePath(portal, packageSlug)}/workspace/${workspaceSlug}`;
  return surface && surface !== "workspace" ? `${base}/${surface}` : base;
}

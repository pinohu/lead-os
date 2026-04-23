import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubdomainConfig {
  subdomain: string;
  templateId?: string;
  customDomain?: string;
  sslEnabled: boolean;
  cdnEnabled: boolean;
}

export interface HostedSite {
  id: string;
  tenantId: string;
  subdomain: string;
  fullUrl: string;
  customDomain?: string;
  status: "provisioning" | "active" | "suspended" | "deploying";
  sslStatus: "pending" | "active" | "failed";
  lastDeployAt?: string;
  createdAt: string;
}

export interface BuildArtifacts {
  html: string;
  css: string;
  js?: string;
  assets?: { name: string; content: string }[];
}

export interface DeployResult {
  deployId: string;
  siteId: string;
  status: "building" | "deploying" | "live" | "failed";
  url: string;
  deployedAt: string;
}

export interface DeployStatus {
  deployId: string;
  status: "building" | "deploying" | "live" | "failed";
  logs: string[];
  completedAt?: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface SiteAnalytics {
  visitors: number;
  pageviews: number;
  bandwidth: number;
  topPages: { path: string; views: number }[];
}

export interface DomainConfig {
  siteId: string;
  domain: string;
  dnsRecords: { type: string; name: string; value: string }[];
  verified: boolean;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const siteStore = new Map<string, HostedSite>();
const deployStore = new Map<string, DeployStatus>();
const domainStore = new Map<string, DomainConfig>();

export function resetHostedRuntimeStore(): void {
  siteStore.clear();
  deployStore.clear();
  domainStore.clear();
}

export function _getSiteStoreForTesting(): Map<string, HostedSite> {
  return siteStore;
}

export function _getDeployStoreForTesting(): Map<string, DeployStatus> {
  return deployStore;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function provisionSubdomain(
  tenantId: string,
  config: SubdomainConfig,
): Promise<HostedSite> {
  const existing = [...siteStore.values()].find(
    (s) => s.subdomain === config.subdomain,
  );
  if (existing) {
    throw new Error(`Subdomain already taken: ${config.subdomain}`);
  }

  const now = new Date().toISOString();
  const site: HostedSite = {
    id: `site-${randomUUID()}`,
    tenantId,
    subdomain: config.subdomain,
    fullUrl: `https://${config.subdomain}.leados.io`,
    customDomain: config.customDomain,
    status: "provisioning",
    sslStatus: config.sslEnabled ? "pending" : "failed",
    createdAt: now,
  };

  siteStore.set(site.id, site);

  const activated: HostedSite = {
    ...site,
    status: "active",
    sslStatus: config.sslEnabled ? "active" : "failed",
  };
  siteStore.set(site.id, activated);

  return activated;
}

export async function getSite(siteId: string): Promise<HostedSite> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);
  return site;
}

export async function listSites(tenantId: string): Promise<HostedSite[]> {
  return [...siteStore.values()].filter((s) => s.tenantId === tenantId);
}

export async function updateSiteConfig(
  siteId: string,
  updates: Partial<SubdomainConfig>,
): Promise<HostedSite> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);

  const updated: HostedSite = {
    ...site,
    subdomain: updates.subdomain ?? site.subdomain,
    fullUrl: updates.subdomain
      ? `https://${updates.subdomain}.leados.io`
      : site.fullUrl,
    customDomain: updates.customDomain ?? site.customDomain,
    sslStatus: updates.sslEnabled === false ? "failed" : site.sslStatus,
  };

  siteStore.set(siteId, updated);
  return updated;
}

export async function deploySite(
  siteId: string,
  buildArtifacts: BuildArtifacts,
): Promise<DeployResult> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);

  const now = new Date().toISOString();
  const deployId = `deploy-${randomUUID()}`;

  siteStore.set(siteId, { ...site, status: "deploying" });

  const logs = [
    `[${now}] Build started`,
    `[${now}] Processing HTML (${buildArtifacts.html.length} bytes)`,
    `[${now}] Processing CSS (${buildArtifacts.css.length} bytes)`,
  ];

  if (buildArtifacts.js) {
    logs.push(`[${now}] Processing JS (${buildArtifacts.js.length} bytes)`);
  }
  if (buildArtifacts.assets) {
    logs.push(`[${now}] Uploading ${buildArtifacts.assets.length} assets`);
  }

  logs.push(`[${now}] Deploy complete`);

  const status: DeployStatus = {
    deployId,
    status: "live",
    logs,
    completedAt: now,
  };
  deployStore.set(deployId, status);

  siteStore.set(siteId, { ...site, status: "active", lastDeployAt: now });

  return {
    deployId,
    siteId,
    status: "live",
    url: site.fullUrl,
    deployedAt: now,
  };
}

export async function getDeploymentStatus(
  deployId: string,
): Promise<DeployStatus> {
  const status = deployStore.get(deployId);
  if (!status) throw new Error(`Deployment not found: ${deployId}`);
  return status;
}

export async function deleteSite(siteId: string): Promise<void> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);
  siteStore.delete(siteId);
  domainStore.delete(siteId);
}

export async function setCustomDomain(
  siteId: string,
  domain: string,
): Promise<DomainConfig> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);

  const config: DomainConfig = {
    siteId,
    domain,
    dnsRecords: [
      { type: "CNAME", name: domain, value: `${site.subdomain}.leados.io` },
      { type: "TXT", name: `_verify.${domain}`, value: `leados-verify=${siteId}` },
    ],
    verified: false,
  };

  domainStore.set(siteId, config);
  siteStore.set(siteId, { ...site, customDomain: domain });

  return config;
}

export async function getSiteAnalytics(
  siteId: string,
  range: DateRange,
): Promise<SiteAnalytics> {
  const site = siteStore.get(siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);

  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  const days = Math.max(1, Math.ceil((to - from) / 86_400_000));

  return {
    visitors: days * 42,
    pageviews: days * 128,
    bandwidth: days * 1_048_576,
    topPages: [
      { path: "/", views: days * 64 },
      { path: "/services", views: days * 32 },
      { path: "/contact", views: days * 16 },
    ],
  };
}

import { getTenant, getTenantBySlug, type TenantRecord } from "./tenant-store.ts";
import { tenantConfig, type TenantConfig } from "./tenant.ts";

const IGNORED_SUBDOMAINS = new Set(["www", "localhost", "api", "app", "admin"]);

export async function resolveTenantFromRequest(request: Request): Promise<TenantConfig> {
  const headers = request.headers;
  const url = new URL(request.url);

  const tenantIdHeader = headers.get("x-tenant-id");
  if (tenantIdHeader) {
    const record = await getTenant(tenantIdHeader);
    if (record) return buildTenantConfig(record);
  }

  const tenantSlugHeader = headers.get("x-tenant-slug");
  if (tenantSlugHeader) {
    const record = await getTenantBySlug(tenantSlugHeader);
    if (record) return buildTenantConfig(record);
  }

  const tenantParam = url.searchParams.get("tenant");
  if (tenantParam) {
    const record = await getTenant(tenantParam) ?? await getTenantBySlug(tenantParam);
    if (record) return buildTenantConfig(record);
  }

  const host = headers.get("host");
  if (host) {
    const subdomain = host.split(".")[0];
    if (subdomain && !IGNORED_SUBDOMAINS.has(subdomain) && !subdomain.includes(":")) {
      const record = await getTenantBySlug(subdomain);
      if (record) return buildTenantConfig(record);
    }
  }

  return tenantConfig;
}

export function buildTenantConfig(record: TenantRecord): TenantConfig {
  return {
    tenantId: record.tenantId,
    brandName: record.brandName,
    siteUrl: record.siteUrl,
    supportEmail: record.supportEmail,
    defaultService: record.defaultService,
    defaultNiche: record.defaultNiche,
    widgetOrigins: record.widgetOrigins,
    accent: record.accent,
    enabledFunnels: record.enabledFunnels,
    channels: record.channels,
  };
}

export function getTenantIdFromRequest(request: Request): string {
  const tenantIdHeader = request.headers.get("x-tenant-id");
  if (tenantIdHeader) return tenantIdHeader;

  const url = new URL(request.url);
  const tenantParam = url.searchParams.get("tenant");
  if (tenantParam) return tenantParam;

  const tenantSlugHeader = request.headers.get("x-tenant-slug");
  if (tenantSlugHeader) return tenantSlugHeader;

  const host = request.headers.get("host");
  if (host) {
    const subdomain = host.split(".")[0];
    if (subdomain && !IGNORED_SUBDOMAINS.has(subdomain) && !subdomain.includes(":")) {
      return subdomain;
    }
  }

  return tenantConfig.tenantId;
}

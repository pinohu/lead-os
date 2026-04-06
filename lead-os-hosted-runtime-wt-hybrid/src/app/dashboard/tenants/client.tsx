"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface TenantRecord {
  tenantId: string;
  slug: string;
  brandName: string;
  siteUrl: string;
  supportEmail: string;
  defaultNiche: string;
  accent: string;
  enabledFunnels: string[];
  channels: Record<string, boolean>;
  revenueModel: string;
  plan: string;
  status: "provisioning" | "active" | "suspended" | "cancelled";
  operatorEmails: string[];
  createdAt: string;
}

const STATUS_CLASSES: Record<string, string> = {
  active: "border-green-500/30 bg-green-500/10 text-green-400",
  provisioning: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  suspended: "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-muted-foreground",
};

const DEMO_TENANTS: TenantRecord[] = [
  { tenantId: "t-acme-roofing", slug: "acme-roofing", brandName: "Acme Roofing Co.", siteUrl: "https://acme-roofing.leadgen-os.com", supportEmail: "support@acme-roofing.com", defaultNiche: "roofing", accent: "#f97316", enabledFunnels: ["lead-magnet", "qualification", "chat"], channels: { email: true, sms: true, whatsapp: false }, revenueModel: "lead-sale", plan: "whitelabel-growth", status: "active", operatorEmails: ["ops@acme-roofing.com"], createdAt: "2026-01-15T09:00:00Z" },
  { tenantId: "t-swift-hvac", slug: "swift-hvac", brandName: "Swift HVAC", siteUrl: "https://swift-hvac.leadgen-os.com", supportEmail: "hello@swifthvac.io", defaultNiche: "hvac", accent: "#3b82f6", enabledFunnels: ["lead-magnet", "qualification", "webinar"], channels: { email: true, sms: true, whatsapp: true }, revenueModel: "retainer", plan: "whitelabel-enterprise", status: "active", operatorEmails: ["admin@swifthvac.io"], createdAt: "2026-02-01T09:00:00Z" },
  { tenantId: "t-green-lawn", slug: "green-lawn", brandName: "Green Lawn Erie", siteUrl: "https://green-lawn.leadgen-os.com", supportEmail: "info@greenlawn.com", defaultNiche: "landscaping", accent: "#22c55e", enabledFunnels: ["lead-magnet", "chat"], channels: { email: true, sms: false, whatsapp: false }, revenueModel: "lead-sale", plan: "whitelabel-starter", status: "provisioning", operatorEmails: [], createdAt: "2026-03-20T09:00:00Z" },
];

export default function TenantsPageClient() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data?.length) {
          setTenants(json.data);
        } else {
          setTenants(DEMO_TENANTS);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setTenants(DEMO_TENANTS);
        setIsDemo(true);
        setLoading(false);
      });
  }, []);

  const toggleExpand = useCallback((tenantId: string) => {
    setExpandedId((prev) => (prev === tenantId ? null : tenantId));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans text-foreground">
        <div className="mx-auto max-w-[1100px] px-6 py-8">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="p-8">
              <p className="text-sm text-foreground0">Loading tenants...</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const activeChannels = (channels: Record<string, boolean>): string[] =>
    Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {isDemo && (
        <div className="border-b border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 px-6 py-2.5 text-sm text-indigo-800 dark:text-indigo-200">
          Demo tenants — Sign in as a super-operator to manage live tenant provisioning.
        </div>
      )}
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="m-0 text-2xl font-bold text-foreground">Tenants</h1>
          <Link href="/onboard" className="inline-flex min-h-11 items-center rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-bold text-primary-foreground no-underline">
            Provision New Tenant
          </Link>
        </div>

        {tenants.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted p-12 text-center">
            <p className="mb-4 text-base text-muted-foreground">No tenants yet</p>
            <Link href="/onboard" className="font-semibold text-teal-400 no-underline">
              Provision your first tenant
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slug</th>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand</th>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niche</th>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</th>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th scope="col" className="border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <>
                    <tr
                      key={tenant.tenantId}
                      className={`cursor-pointer transition-colors duration-150 ${expandedId === tenant.tenantId ? "bg-muted/50" : "bg-transparent"}`}
                      onClick={() => toggleExpand(tenant.tenantId)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && toggleExpand(tenant.tenantId)}
                      aria-expanded={expandedId === tenant.tenantId}
                    >
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">
                        <code className="text-xs text-teal-300">{tenant.slug}</code>
                      </td>
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">{tenant.brandName}</td>
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">{tenant.defaultNiche}</td>
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">{tenant.plan}</td>
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">{tenant.revenueModel}</td>
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold ${STATUS_CLASSES[tenant.status] ?? STATUS_CLASSES.cancelled}`}>{tenant.status}</span>
                      </td>
                      <td className="border-b border-border/50 px-3.5 py-3 text-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    </tr>
                    {expandedId === tenant.tenantId && (
                      <tr key={`${tenant.tenantId}-expanded`} className="bg-muted/30">
                        <td colSpan={7} className="p-0">
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 px-3.5 py-4 text-xs">
                            <div>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground0">Site URL</div>
                              <div className="text-sm text-foreground">{tenant.siteUrl || "Not set"}</div>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground0">Operator Emails</div>
                              <div className="text-sm text-foreground">{tenant.operatorEmails.join(", ") || "None"}</div>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground0">Enabled Funnels</div>
                              <div className="text-sm text-foreground">{tenant.enabledFunnels.join(", ") || "None"}</div>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground0">Active Channels</div>
                              <div className="text-sm text-foreground">{activeChannels(tenant.channels).join(", ") || "None"}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

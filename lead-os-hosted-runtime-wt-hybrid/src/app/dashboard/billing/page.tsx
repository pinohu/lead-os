"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface UsageRecord {
  tenantId: string;
  period: string;
  leads: number;
  emails: number;
  sms: number;
  whatsapp: number;
  updatedAt: string;
}

interface PlanLimits {
  leadsPerMonth: number;
  emailsPerMonth: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
}

interface PlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  limits: PlanLimits;
  features: string[];
}

const PLAN_INFO: Record<string, PlanInfo> = {
  "whitelabel-starter": {
    id: "whitelabel-starter",
    name: "White-Label Starter",
    monthlyPrice: 9900,
    limits: { leadsPerMonth: 100, emailsPerMonth: 1000, smsPerMonth: 100, whatsappPerMonth: 50 },
    features: ["Lead capture", "Basic scoring", "Email nurture", "1 niche"],
  },
  "whitelabel-growth": {
    id: "whitelabel-growth",
    name: "White-Label Growth",
    monthlyPrice: 24900,
    limits: { leadsPerMonth: 500, emailsPerMonth: 5000, smsPerMonth: 500, whatsappPerMonth: 200 },
    features: ["Everything in Starter", "A/B testing", "Attribution", "3 niches", "WhatsApp"],
  },
  "whitelabel-enterprise": {
    id: "whitelabel-enterprise",
    name: "White-Label Enterprise",
    monthlyPrice: 49900,
    limits: { leadsPerMonth: 2000, emailsPerMonth: 25000, smsPerMonth: 2000, whatsappPerMonth: 1000 },
    features: ["Everything in Growth", "Unlimited funnels", "Marketplace access", "Priority support"],
  },
};

const DEFAULT_PLAN = PLAN_INFO["whitelabel-starter"];

const DEMO_USAGE: UsageRecord = {
  tenantId: "demo-tenant",
  period: new Date().toISOString().slice(0, 7),
  leads: 47,
  emails: 312,
  sms: 18,
  whatsapp: 6,
  updatedAt: new Date().toISOString(),
};

const DEMO_HISTORY_RECORDS: UsageRecord[] = [
  { tenantId: "demo-tenant", period: "2026-02", leads: 38, emails: 241, sms: 12, whatsapp: 4, updatedAt: "2026-02-28T23:00:00Z" },
  { tenantId: "demo-tenant", period: "2026-01", leads: 29, emails: 188, sms: 9, whatsapp: 2, updatedAt: "2026-01-31T23:00:00Z" },
  { tenantId: "demo-tenant", period: "2025-12", leads: 55, emails: 389, sms: 24, whatsapp: 11, updatedAt: "2025-12-31T23:00:00Z" },
];
const TENANT_ID = "default-tenant";

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function generatePastPeriods(count: number): string[] {
  const periods: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    periods.push(`${year}-${month}`);
  }
  return periods;
}

function meterFillColor(percent: number): string {
  if (percent >= 90) return "bg-red-400";
  if (percent >= 70) return "bg-yellow-400";
  return "bg-teal-500";
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [plan, setPlan] = useState(DEFAULT_PLAN);

  useEffect(() => {
    fetch(`/api/billing/usage?tenantId=${TENANT_ID}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data) {
          setUsage(json.data);
          const detectedPlanId = json.data?.planId ?? json.meta?.planId;
          if (detectedPlanId && PLAN_INFO[detectedPlanId as keyof typeof PLAN_INFO]) {
            setPlan(PLAN_INFO[detectedPlanId as keyof typeof PLAN_INFO]);
          }
        } else {
          setUsage(DEMO_USAGE);
          setHistoryRecords(DEMO_HISTORY_RECORDS);
          setIsDemo(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setUsage(DEMO_USAGE);
        setHistoryRecords(DEMO_HISTORY_RECORDS);
        setIsDemo(true);
        setLoading(false);
      });

    const periods = generatePastPeriods(6);
    Promise.all(
      periods.map((period) =>
        fetch(`/api/billing/usage?tenantId=${TENANT_ID}&period=${period}`, { credentials: "include" })
          .then((res) => res.ok ? res.json() : null)
          .then((json) => json?.data ?? null)
          .catch(() => null)
      ),
    ).then((results) => {
      const records = results.filter((r): r is UsageRecord => r !== null);
      setHistoryRecords(records);
    });
  }, []);

  const handleManageBilling = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, returnUrl: window.location.href }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <section className="rounded-xl bg-muted border border-border p-6">
            <p className="text-muted-foreground text-sm">Loading billing data...</p>
          </section>
        </div>
      </main>
    );
  }

  const currentUsage = usage ?? DEMO_USAGE;

  const meters = [
    { label: "Leads", used: currentUsage.leads, limit: plan.limits.leadsPerMonth },
    { label: "Emails", used: currentUsage.emails, limit: plan.limits.emailsPerMonth },
    { label: "SMS", used: currentUsage.sms, limit: plan.limits.smsPerMonth },
    { label: "WhatsApp", used: currentUsage.whatsapp, limit: plan.limits.whatsappPerMonth },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {isDemo && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-300 dark:border-blue-800 px-6 py-2.5 text-sm text-blue-800 dark:text-blue-200">
          Demo data — Sign in to view your live usage and billing details.{" "}
          <Link href="/auth/sign-in" className="text-blue-600 dark:text-blue-400 underline">Sign in</Link>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-300 dark:border-red-800 px-6 py-2.5 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Billing</h1>

        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5 mb-6">
          <div className="rounded-xl bg-muted border border-border p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">Current Period Usage</h2>
            {meters.map((meter) => {
              const pct = usagePercent(meter.used, meter.limit);
              const limitLabel = meter.limit < 0 ? "Unlimited" : meter.limit.toLocaleString();
              return (
                <div key={meter.label} className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-semibold">{meter.label}</span>
                    <span className="text-muted-foreground">
                      {meter.used.toLocaleString()} / {limitLabel}
                      {meter.limit > 0 ? ` (${pct}%)` : ""}
                    </span>
                  </div>
                  <div className="h-2.5 bg-teal-900/20 rounded-[5px] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${meter.label} usage`}>
                    <div className={`h-full rounded-[5px] transition-all duration-400 ${meterFillColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-muted border border-border p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">Plan Details</h2>
            <div className="flex justify-between py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="text-foreground font-semibold">{plan.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Monthly Price</span>
              <span className="text-foreground font-semibold">{formatCurrency(plan.monthlyPrice)}/mo</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Lead Limit</span>
              <span className="text-foreground font-semibold">{plan.limits.leadsPerMonth < 0 ? "Unlimited" : plan.limits.leadsPerMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Email Limit</span>
              <span className="text-foreground font-semibold">{plan.limits.emailsPerMonth < 0 ? "Unlimited" : plan.limits.emailsPerMonth.toLocaleString()}</span>
            </div>
            <ul className="list-none p-0 mt-3">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-foreground py-0.5">{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl bg-muted border border-border p-6 mb-6">
          <h2 className="text-sm font-bold text-foreground mb-4">Usage History</h2>
          {historyRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm">No usage history available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">Period</th>
                    <th scope="col" className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">Leads</th>
                    <th scope="col" className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">Emails</th>
                    <th scope="col" className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">SMS</th>
                    <th scope="col" className="text-left px-3.5 py-2.5 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record) => (
                    <tr key={record.period}>
                      <td className="px-3.5 py-2.5 border-b border-border/50 text-foreground">{record.period}</td>
                      <td className="px-3.5 py-2.5 border-b border-border/50 text-foreground">{record.leads.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 border-b border-border/50 text-foreground">{record.emails.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 border-b border-border/50 text-foreground">{record.sms.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 border-b border-border/50 text-foreground">{record.whatsapp.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 flex-wrap">
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className={`px-5 py-2.5 rounded-lg border border-border bg-transparent text-muted-foreground text-sm font-semibold cursor-pointer min-h-[44px] ${portalLoading ? "opacity-60" : ""}`}
            aria-busy={portalLoading}
          >
            {portalLoading ? "Opening..." : "Manage Billing"}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ tenantId: TENANT_ID, planId: "whitelabel-growth" }),
                });
                const json = await res.json();
                if (json.data?.url) {
                  window.location.href = json.data.url;
                } else if (json.data?.free) {
                  window.location.reload();
                }
              } catch {
                setError("Failed to start checkout");
              }
            }}
            className="px-5 py-2.5 rounded-lg border-none bg-teal-500 text-primary-foreground text-sm font-bold cursor-pointer min-h-[44px]"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </main>
  );
}

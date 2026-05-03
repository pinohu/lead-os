"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface CredentialPublic {
  id: string;
  tenantId: string;
  provider: string;
  credentialType: string;
  status: "active" | "expired" | "revoked";
  lastVerified?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProviderDefinition {
  provider: string;
  category: string;
  fields: string[];
  enables: string[];
}

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  deployment: "Deployment",
  communication: "Communication",
  billing: "Billing",
  ai: "AI & Intelligence",
  crm: "CRM",
  scheduling: "Scheduling",
  documents: "Documents",
  growth: "Growth",
  alerts: "Alerts & Notifications",
  data: "Data & Storage",
  automation: "Automation",
  analytics: "Analytics",
  content: "Content & Media",
  marketing: "Marketing",
  sms: "SMS",
  "ai-voice": "AI Voice",
  "ai-chatbot": "AI Chatbot",
  "ai-video": "AI Video",
  "ai-content": "AI Content",
  "page-builder": "Page Builder",
  "conversion-optimization": "Conversion Optimization",
  email: "Email",
  "video-hosting": "Video Hosting",
  "web-scraping": "Web Scraping",
  forms: "Forms",
  "browser-automation": "Browser Automation",
  hosting: "Hosting",
  widgets: "Widgets",
  workflow: "Workflow",
  "mcp-tools": "MCP Tools",
  "agent-orchestration": "Agent Orchestration",
};

function isSecretField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower.includes("key") || lower.includes("secret") || lower.includes("token");
}

function groupByCategory(providers: ProviderDefinition[]): Record<string, ProviderDefinition[]> {
  const grouped: Record<string, ProviderDefinition[]> = {};
  for (const p of providers) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }
  return grouped;
}

function findCredential(provider: string, credentials: CredentialPublic[]): CredentialPublic | undefined {
  return credentials.find((c) => c.provider === provider && c.status === "active");
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialPublic[]>([]);
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const [busyProviders, setBusyProviders] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/credentials", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setCredentials(json.data.credentials ?? []);
        setProviders(json.data.providers ?? []);
      } else {
        setCredentials([]);
        setProviders([]);
      }
      setLoading(false);
    } catch {
      setCredentials([]);
      setProviders([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setBusy = useCallback((provider: string, busy: boolean) => {
    setBusyProviders((prev) => {
      const next = new Set(prev);
      if (busy) { next.add(provider); } else { next.delete(provider); }
      return next;
    });
  }, []);

  const setProviderFeedback = useCallback((provider: string, fb: FeedbackState | null) => {
    setFeedback((prev) => {
      if (fb === null) { const next = { ...prev }; delete next[provider]; return next; }
      return { ...prev, [provider]: fb };
    });
  }, []);

  const handleConnect = useCallback(async (provider: ProviderDefinition) => {
    setExpandedProvider((prev) => (prev === provider.provider ? null : provider.provider));
    setProviderFeedback(provider.provider, null);
    const initial: Record<string, string> = {};
    for (const field of provider.fields) { initial[field] = ""; }
    setFormValues(initial);
  }, [setProviderFeedback]);

  const handleSave = useCallback(async (provider: ProviderDefinition) => {
    setBusy(provider.provider, true);
    setProviderFeedback(provider.provider, null);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: provider.provider, credentialType: "api-key", credentials: formValues }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProviderFeedback(provider.provider, { type: "error", message: json.error?.message || `Failed to save (${res.status})` });
        return;
      }
      setProviderFeedback(provider.provider, { type: "success", message: "Credential saved successfully" });
      setExpandedProvider(null);
      await fetchData();
    } catch (err) {
      setProviderFeedback(provider.provider, { type: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setBusy(provider.provider, false);
    }
  }, [formValues, fetchData, setBusy, setProviderFeedback]);

  const handleDisconnect = useCallback(async (providerName: string) => {
    setBusy(providerName, true);
    setProviderFeedback(providerName, null);
    try {
      const res = await fetch(`/api/credentials?provider=${encodeURIComponent(providerName)}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setProviderFeedback(providerName, { type: "error", message: json.error?.message || `Failed to disconnect (${res.status})` });
        return;
      }
      setProviderFeedback(providerName, { type: "success", message: "Credential removed" });
      await fetchData();
    } catch (err) {
      setProviderFeedback(providerName, { type: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setBusy(providerName, false);
    }
  }, [fetchData, setBusy, setProviderFeedback]);

  const handleVerify = useCallback(async (providerName: string) => {
    setBusy(providerName, true);
    setProviderFeedback(providerName, null);
    try {
      const res = await fetch("/api/credentials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: providerName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProviderFeedback(providerName, { type: "error", message: json.error?.message || `Verification failed (${res.status})` });
        return;
      }
      const result = json.data;
      setProviderFeedback(providerName, { type: result.valid ? "success" : "error", message: result.message });
      await fetchData();
    } catch (err) {
      setProviderFeedback(providerName, { type: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setBusy(providerName, false);
    }
  }, [fetchData, setBusy, setProviderFeedback]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <div className="rounded-xl bg-muted border border-border p-6">
            <p className="text-muted-foreground text-sm">Loading credentials...</p>
          </div>
        </div>
      </main>
    );
  }

  const connectedCount = credentials.filter((c) => c.status === "active").length;
  const allCapabilities = new Set<string>();
  for (const cred of credentials) {
    if (cred.status === "active") {
      for (const cap of cred.capabilities) { allCapabilities.add(cap); }
    }
  }

  const filteredProviders = searchQuery
    ? providers.filter((p) =>
        p.provider.replace(/_/g, " ").toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.enables.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : providers;

  const grouped = groupByCategory(filteredProviders);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Account Access Vault</h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-[640px] leading-relaxed">
          Connect approved provider accounts to unlock live capabilities. Each provider enables specific
          features across the platform. Sensitive access values are encrypted at rest with AES-256-GCM.
        </p>

        <nav className="flex gap-3 mb-6 flex-wrap" aria-label="Credentials navigation">
          <Link href="/dashboard" className="text-teal-500 no-underline font-semibold text-sm">
            Back to dashboard
          </Link>
          <Link href="/dashboard/providers" className="text-teal-500 no-underline font-semibold text-sm">
            Provider health
          </Link>
        </nav>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
          <div className="rounded-xl bg-muted border border-border px-6 py-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Connected</p>
            <p className="text-2xl font-bold text-foreground">
              {connectedCount} / {providers.length}
            </p>
          </div>
          <div className="rounded-xl bg-muted border border-border px-6 py-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Capabilities</p>
            <p className="text-2xl font-bold text-foreground">
              {allCapabilities.size} active
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="credential-search" className="block text-xs font-semibold text-foreground mb-1">
            Search providers
          </label>
          <input
            id="credential-search"
            type="search"
            placeholder="Filter by name or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-[400px] px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground text-sm outline-none min-h-[44px]"
            aria-label="Search providers by name or capability"
          />
        </div>

        {Object.keys(grouped).length === 0 && (
          <div className="rounded-xl bg-muted border border-border p-6">
            <p className="text-muted-foreground text-sm">No providers match your search.</p>
          </div>
        )}

        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryProviders]) => (
            <section key={category} className="mb-8" aria-label={`${CATEGORY_LABELS[category] || category} providers`}>
              <h2 className="text-lg font-bold text-foreground mb-3">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-4">
                {categoryProviders.map((provider) => {
                  const cred = findCredential(provider.provider, credentials);
                  const connected = Boolean(cred);
                  const isBusy = busyProviders.has(provider.provider);
                  const isExpanded = expandedProvider === provider.provider;
                  const providerFeedback = feedback[provider.provider];
                  const providerId = provider.provider.replace(/_/g, "-");

                  return (
                    <article
                      key={provider.provider}
                      className="rounded-xl bg-muted border border-border p-6"
                      aria-label={`${provider.provider.replace(/_/g, " ")} provider`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[0.95rem] font-bold text-foreground capitalize">
                          {provider.provider.replace(/_/g, " ")}
                        </h3>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${connected ? "bg-emerald-600/15 text-emerald-400" : "bg-slate-700/40 text-slate-200"}`}>
                          {connected ? "Connected" : "Not connected"}
                        </span>
                      </div>

                      <p className="text-muted-foreground text-sm mt-1 leading-snug">
                        Enables: {provider.enables.join(", ")}
                      </p>

                      {cred?.lastVerified && (
                        <p className="text-muted-foreground text-xs mt-1.5">
                          Last verified: {new Date(cred.lastVerified).toLocaleDateString()}
                        </p>
                      )}

                      {providerFeedback && (
                        <div
                          className={`mt-2 px-3 py-2 rounded-md text-sm font-semibold ${providerFeedback.type === "success" ? "bg-emerald-600/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                          role="status"
                          aria-live="polite"
                        >
                          {providerFeedback.message}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {connected ? (
                          <>
                            <button
                              type="button"
                              className={`px-4 py-2 rounded-lg border border-border bg-transparent text-muted-foreground text-sm font-semibold cursor-pointer min-h-[44px] min-w-[44px] ${isBusy ? "opacity-70" : ""}`}
                              onClick={() => handleVerify(provider.provider)}
                              disabled={isBusy}
                              aria-busy={isBusy}
                              aria-label={`Verify ${provider.provider.replace(/_/g, " ")} account access`}
                            >
                              {isBusy ? "Verifying..." : "Verify"}
                            </button>
                            <button
                              type="button"
                              className={`px-4 py-2 rounded-lg border border-red-500/30 bg-transparent text-red-400 text-sm font-semibold cursor-pointer min-h-[44px] min-w-[44px] ${isBusy ? "opacity-70" : ""}`}
                              onClick={() => handleDisconnect(provider.provider)}
                              disabled={isBusy}
                              aria-busy={isBusy}
                              aria-label={`Disconnect ${provider.provider.replace(/_/g, " ")}`}
                            >
                              {isBusy ? "Disconnecting..." : "Disconnect"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg border-none bg-teal-700 text-white text-sm font-bold cursor-pointer min-h-[44px] min-w-[44px]"
                            onClick={() => handleConnect(provider)}
                            aria-expanded={isExpanded}
                            aria-controls={`form-${providerId}`}
                            aria-label={`Connect ${provider.provider.replace(/_/g, " ")}`}
                          >
                            {isExpanded ? "Cancel" : "Connect"}
                          </button>
                        )}
                      </div>

                      {isExpanded && !connected && (
                        <div
                          id={`form-${providerId}`}
                          className="mt-3 p-4 bg-muted/30 border border-border/50 rounded-lg"
                          role="form"
                          aria-label={`${provider.provider.replace(/_/g, " ")} account access form`}
                        >
                          {provider.fields.map((field) => {
                            const fieldId = `${providerId}-${field}`;
                            return (
                              <div key={field} className="mb-3">
                                <label htmlFor={fieldId} className="block text-xs font-semibold text-foreground mb-1">
                                  {field.replace(/_/g, " ")}
                                </label>
                                <input
                                  id={fieldId}
                                  type={isSecretField(field) ? "password" : "text"}
                                  value={formValues[field] || ""}
                                  onChange={(e) =>
                                    setFormValues((prev) => ({ ...prev, [field]: e.target.value }))
                                  }
                                  className="w-full px-3 py-2 rounded-md border border-border bg-muted text-foreground text-sm outline-none min-h-[44px] box-border"
                                  autoComplete="off"
                                  aria-label={`${provider.provider.replace(/_/g, " ")} ${field.replace(/_/g, " ")}`}
                                />
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg border-none bg-teal-700 text-white text-sm font-bold cursor-pointer min-h-[44px] min-w-[44px] mt-1 ${isBusy ? "opacity-70" : ""}`}
                            onClick={() => handleSave(provider)}
                            disabled={isBusy}
                            aria-busy={isBusy}
                            aria-label={`Save ${provider.provider.replace(/_/g, " ")} account access`}
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}

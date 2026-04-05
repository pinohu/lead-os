// ── Provider Dashboard — Integrations ─────────────────────────────────
// API key management with create/revoke, webhook URL display, code snippets.

"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiKeyDisplay {
  id: string;
  label: string;
  last4: string;
  permissions: string[];
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NewKeyResponse {
  id: string;
  label: string;
  rawKey: string;
  last4: string;
  createdAt: string;
}

export default function IntegrationsPage() {
  const [keys, setKeys] = useState<ApiKeyDisplay[]>([]);
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "embed">("curl");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://erie.pro";
  const webhookUrl = `${appUrl}/api/leads/inbound`;

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/api-keys");
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch {
      // silently fail on load
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function createKey() {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/provider/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.key);
        setLabel("");
        fetchKeys();
      } else {
        setError(data.error || "Failed to create key");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key? Any integrations using it will stop working.")) return;
    try {
      const res = await fetch("/api/provider/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchKeys();
    } catch {
      // silently fail
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "8145551234",
    "niche": "plumbing",
    "message": "Need a plumber ASAP"
  }'`;

  const jsExample = `const response = await fetch("${webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY",
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    phone: "8145551234",
    niche: "plumbing",
    message: "Need a plumber ASAP",
  }),
});
const data = await response.json();
console.log(data); // { success: true, leadId: "...", routedTo: "..." }`;

  const embedExample = `<!-- Add to any webpage to embed a lead form -->
<script
  src="${appUrl}/embed.js"
  data-key="YOUR_API_KEY"
  data-niche="plumbing"
></script>`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect external systems to send leads via API or embed a lead form on your website.
        </p>
      </div>

      {/* ── Webhook URL ──────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Webhook URL</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          POST leads to this endpoint with your API key in the X-API-Key header.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono text-foreground">
            {webhookUrl}
          </code>
          <button
            onClick={() => copyToClipboard(webhookUrl)}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      {/* ── API Keys ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">API Keys</h2>

        {/* New key alert */}
        {newKey && (
          <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Save this key now -- it will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono text-foreground break-all border border-yellow-300">
                {newKey.rawKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey.rawKey)}
                className="shrink-0 rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="text-xs text-yellow-700 dark:text-yellow-300 underline"
            >
              I have saved the key
            </button>
          </div>
        )}

        {/* Create new key */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="key-label" className="block text-sm font-medium text-foreground mb-1">
              Key Label
            </label>
            <input
              id="key-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Website, Zapier, CRM Integration"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={100}
            />
          </div>
          <button
            onClick={createKey}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create Key"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Key list */}
        {keys.length > 0 ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{k.label}</span>
                    <code className="text-xs text-muted-foreground">...{k.last4}</code>
                    {!k.isActive && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Revoked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt && ` \u00B7 Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                {k.isActive && (
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
        )}
      </section>

      {/* ── Code Examples ────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Code Examples</h2>

        <div className="flex gap-1 border-b border-border">
          {(["curl", "js", "embed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "curl" ? "cURL" : tab === "js" ? "JavaScript" : "Embed Widget"}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm font-mono text-foreground">
            {activeTab === "curl" && curlExample}
            {activeTab === "js" && jsExample}
            {activeTab === "embed" && embedExample}
          </pre>
          <button
            onClick={() =>
              copyToClipboard(
                activeTab === "curl"
                  ? curlExample
                  : activeTab === "js"
                    ? jsExample
                    : embedExample
              )
            }
            className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            Copy
          </button>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <strong>Request fields:</strong>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            <li><code>email</code> (required) - Contact email</li>
            <li><code>name</code> or <code>firstName</code> + <code>lastName</code> - Contact name</li>
            <li><code>phone</code> - Contact phone number</li>
            <li><code>niche</code> or <code>service</code> - Service category slug</li>
            <li><code>message</code> - Additional details</li>
            <li><code>source</code> - Origin of the lead (defaults to &quot;webhook&quot;)</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

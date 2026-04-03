// ── Provider Dashboard — Webhooks ─────────────────────────────────────
// Register, manage, and test outbound webhook endpoints.

"use client";

import { useState, useEffect, useCallback } from "react";

const AVAILABLE_EVENTS = [
  { value: "lead.created", label: "Lead Created", description: "When a new lead is routed to you" },
  { value: "lead.routed", label: "Lead Routed", description: "When a lead is assigned to your territory" },
  { value: "lead.outcome", label: "Lead Outcome", description: "When a lead outcome is recorded" },
  { value: "lead.disputed", label: "Lead Disputed", description: "When a lead dispute is filed" },
];

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failCount: number;
  createdAt: string;
  secret?: string;
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["lead.created"]);
  const [newEndpoint, setNewEndpoint] = useState<WebhookEndpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/webhooks");
      const data = await res.json();
      if (data.success) setEndpoints(data.endpoints);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  }

  async function createEndpoint() {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    if (selectedEvents.length === 0) {
      setError("Select at least one event");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/provider/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), events: selectedEvents }),
      });
      const data = await res.json();
      if (data.success) {
        setNewEndpoint(data.endpoint);
        setUrl("");
        setSelectedEvents(["lead.created"]);
        fetchEndpoints();
      } else {
        setError(data.error || "Failed to create webhook");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEndpoint(id: string) {
    if (!confirm("Remove this webhook endpoint?")) return;
    try {
      const res = await fetch("/api/provider/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchEndpoints();
    } catch {
      // silently fail
    }
  }

  async function testEndpoint(id: string) {
    setTestResults((prev) => ({ ...prev, [id]: { success: false, error: "Testing..." } }));
    try {
      const res = await fetch("/api/provider/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: data.success, error: data.error },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, error: "Network error" },
      }));
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatusBadge(ep: WebhookEndpoint) {
    if (!ep.isActive) {
      return (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          Disabled
        </span>
      );
    }
    if (ep.failCount > 0) {
      return (
        <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
          {ep.failCount} failures
        </span>
      );
    }
    return (
      <span className="rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
        Active
      </span>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receive real-time notifications when events happen on your account.
        </p>
      </div>

      {/* ── New endpoint secret alert ──────────────────────── */}
      {newEndpoint?.secret && (
        <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            Save this signing secret now -- it will not be shown again.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Use this secret to verify webhook signatures (X-Webhook-Signature header).
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono text-foreground break-all border border-yellow-300">
              {newEndpoint.secret}
            </code>
            <button
              onClick={() => copySecret(newEndpoint.secret!)}
              className="shrink-0 rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700 transition-colors"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewEndpoint(null)}
            className="text-xs text-yellow-700 dark:text-yellow-300 underline"
          >
            I have saved the secret
          </button>
        </div>
      )}

      {/* ── Register New Webhook ────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Add Webhook Endpoint</h2>

        <div>
          <label htmlFor="webhook-url" className="block text-sm font-medium text-foreground mb-1">
            Endpoint URL
          </label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com/webhooks/erie"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground mb-2">Events</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AVAILABLE_EVENTS.map((ev) => (
              <label
                key={ev.value}
                className="flex items-start gap-2 rounded-md border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(ev.value)}
                  onChange={() => toggleEvent(ev.value)}
                  className="mt-0.5 rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">{ev.label}</span>
                  <p className="text-xs text-muted-foreground">{ev.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={createEndpoint}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Add Endpoint"}
        </button>
      </section>

      {/* ── Existing Endpoints ──────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Registered Endpoints</h2>

        {endpoints.length > 0 ? (
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="rounded-md border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground truncate">
                        {ep.url}
                      </code>
                      {getStatusBadge(ep)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Events: {ep.events.join(", ")} | Created{" "}
                      {new Date(ep.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => testEndpoint(ep.id)}
                    className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Send Test
                  </button>
                  <button
                    onClick={() => deleteEndpoint(ep.id)}
                    className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {testResults[ep.id] && (
                  <div
                    className={`text-xs rounded-md px-3 py-2 ${
                      testResults[ep.id].success
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {testResults[ep.id].success
                      ? "Test webhook delivered successfully"
                      : `Test failed: ${testResults[ep.id].error || "Unknown error"}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No webhook endpoints registered yet.
          </p>
        )}
      </section>

      {/* ── Signature Verification Guide ─────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Verifying Signatures</h2>
        <p className="text-sm text-muted-foreground">
          Each webhook request includes an <code>X-Webhook-Signature</code> header.
          Verify it by computing an HMAC-SHA256 of the raw request body using your signing secret.
        </p>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm font-mono text-foreground">
{`const crypto = require("crypto");

function verifyWebhook(body, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
        </pre>
      </section>
    </div>
  );
}

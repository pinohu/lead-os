"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Notification preference keys and labels ─────────────────────────
const NOTIFICATION_OPTIONS = [
  {
    key: "new_leads",
    label: "New Leads",
    description: "Get notified when a new lead is submitted in your territory",
  },
  {
    key: "sla_warnings",
    label: "SLA Warnings",
    description: "Alerts when a lead is approaching its response deadline",
  },
  {
    key: "payment_alerts",
    label: "Payment Alerts",
    description: "Notifications about billing, failed payments, and receipts",
  },
  {
    key: "weekly_digest",
    label: "Weekly Digest",
    description: "A summary of your leads, performance, and territory stats each week",
  },
  {
    key: "marketing",
    label: "Marketing & Updates",
    description: "Product updates, tips, and promotional offers from the platform",
  },
] as const;

type NotifKey = (typeof NOTIFICATION_OPTIONS)[number]["key"];

type NotifPrefs = Record<NotifKey, boolean>;

const DEFAULT_PREFS: NotifPrefs = {
  new_leads: true,
  sla_warnings: true,
  payment_alerts: true,
  weekly_digest: true,
  marketing: true,
};

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current preferences on mount
  useEffect(() => {
    fetch("/api/provider/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.prefs) {
          setPrefs({ ...DEFAULT_PREFS, ...data.prefs });
        }
      })
      .catch(() => {
        // Use defaults on error
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback((key: NotifKey) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/provider/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error ?? "Failed to save preferences.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Notification Preferences
        </h1>
        <p className="mt-1 text-muted-foreground">
          Choose which notifications you receive. All notifications are enabled by default.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Manage the types of emails you receive from the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading preferences...
            </div>
          ) : (
            NOTIFICATION_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                htmlFor={`notif-${opt.key}`}
                className="flex items-center justify-between rounded-lg border border-transparent hover:border-border px-4 py-3 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                <button
                  id={`notif-${opt.key}`}
                  role="switch"
                  type="button"
                  aria-checked={prefs[opt.key]}
                  onClick={() => handleToggle(opt.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    prefs[opt.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      prefs[opt.key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            ))
          )}
        </CardContent>
      </Card>

      {error && (
        <div role="alert" className="rounded-md p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in-0 duration-300">
            <CheckCircle2 className="h-4 w-4" />
            Preferences saved
          </span>
        )}
      </div>
    </div>
  );
}

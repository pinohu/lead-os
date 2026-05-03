"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

interface Preferences {
  allEmails: boolean;
  nurture: boolean;
  marketing: boolean;
  transactional: boolean;
}

function PreferencesContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const tenant = searchParams.get("tenant") ?? "";
  const token = searchParams.get("token") ?? "";

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isValid = email.length > 0 && tenant.length > 0 && token.length > 0;

  useEffect(() => {
    if (!isValid) { setLoading(false); return; }

    fetch(`/api/preferences?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Failed to load preferences");
        setPreferences(json.data.preferences);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [email, tenant, token, isValid]);

  const handleSave = useCallback(async (allEmails: boolean) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenant, token, preferences: { allEmails } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to update preferences");
      setPreferences(json.data.preferences);
      setSuccess(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [email, tenant, token]);

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted font-sans">
        <main className="m-6 max-w-[520px] rounded-xl bg-card p-12 text-center shadow-md">
          <h1 className="mb-4 text-2xl text-foreground">Email Preferences</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            This page requires a valid link from your email. Look for the &quot;Manage Preferences&quot; link in the footer of any email you received from us.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted px-4 py-12 font-sans">
      <main className="w-full max-w-[560px] rounded-xl bg-card p-10 shadow-md" role="main">
        <h1 className="mb-2 text-2xl text-foreground">Email Preferences</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Manage email preferences for <strong>{email}</strong>
        </p>

        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {loading && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">Loading your preferences...</p>
          </div>
        )}

        {!loading && preferences && (
          <div className="flex flex-col gap-4">
            <fieldset className="rounded-lg border border-border p-6">
              <legend className="px-2 text-base font-semibold text-foreground">Email Types</legend>

              <div className="mt-2 flex flex-col gap-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.allEmails}
                    onChange={(e) => setPreferences({ ...preferences, allEmails: e.target.checked, nurture: e.target.checked, marketing: e.target.checked })}
                    disabled={saving}
                    className="mt-[3px] h-[18px] w-[18px] accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Marketing &amp; Nurture Emails</div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      Tips, guides, case studies, and personalized recommendations to help you grow.
                    </div>
                  </div>
                </label>

                <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-[3px] h-[18px] w-[18px]"
                    aria-label="Transactional emails (always enabled)"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Transactional Emails</div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      Booking confirmations, account updates, and security alerts. These cannot be disabled.
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleSave(preferences.allEmails)}
                disabled={saving}
                className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                style={{ cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="rounded-md border border-destructive/30 bg-card px-6 py-2.5 text-sm font-medium text-destructive"
                style={{ cursor: saving ? "wait" : "pointer" }}
              >
                Unsubscribe from All
              </button>
            </div>

            <div className="mt-2 border-t border-border pt-4">
              <a
                href={`/manage-data?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}`}
                className="text-[13px] text-muted-foreground underline"
              >
                Manage all my data (export or delete)
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="font-sans text-muted-foreground">Loading...</p>
      </div>
    }>
      <PreferencesContent />
    </Suspense>
  );
}

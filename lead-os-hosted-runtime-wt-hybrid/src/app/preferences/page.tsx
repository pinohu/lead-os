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
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <main style={{ maxWidth: 520, padding: 48, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center", margin: 24 }}>
          <h1 style={{ fontSize: 24, color: "#111827", margin: "0 0 16px" }}>Email Preferences</h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.6 }}>
            This page requires a valid link from your email. Look for the &quot;Manage Preferences&quot; link in the footer of any email you received from us.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "48px 16px" }}>
      <main style={{ maxWidth: 560, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: 40 }} role="main">
        <h1 style={{ fontSize: 24, color: "#111827", margin: "0 0 8px" }}>Email Preferences</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 32px" }}>
          Manage email preferences for <strong>{email}</strong>
        </p>

        {error && (
          <div role="alert" style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {success && (
          <div role="status" style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#166534", fontSize: 14, marginBottom: 24 }}>
            {success}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Loading your preferences...</p>
          </div>
        )}

        {!loading && preferences && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 24, margin: 0 }}>
              <legend style={{ fontSize: 16, fontWeight: 600, color: "#111827", padding: "0 8px" }}>Email Types</legend>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={preferences.allEmails}
                    onChange={(e) => setPreferences({ ...preferences, allEmails: e.target.checked, nurture: e.target.checked, marketing: e.target.checked })}
                    disabled={saving}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: "#4f46e5" }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Marketing &amp; Nurture Emails</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                      Tips, guides, case studies, and personalized recommendations to help you grow.
                    </div>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, opacity: 0.6 }}>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    style={{ marginTop: 3, width: 18, height: 18 }}
                    aria-label="Transactional emails (always enabled)"
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Transactional Emails</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                      Booking confirmations, account updates, and security alerts. These cannot be disabled.
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => handleSave(preferences.allEmails)}
                disabled={saving}
                style={{ padding: "10px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                style={{ padding: "10px 24px", backgroundColor: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: saving ? "wait" : "pointer" }}
              >
                Unsubscribe from All
              </button>
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: 8 }}>
              <a
                href={`/manage-data?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}`}
                style={{ fontSize: 13, color: "#6b7280", textDecoration: "underline" }}
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
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
        <p style={{ color: "#6b7280", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Loading...</p>
      </div>
    }>
      <PreferencesContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

type Action = "view" | "export" | "delete" | "done";

function ManageDataContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const tenant = searchParams.get("tenant") ?? "";
  const token = searchParams.get("token") ?? "";

  const [action, setAction] = useState<Action>("view");
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isValid = email.length > 0 && tenant.length > 0 && token.length > 0;

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/gdpr/self-service?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}&action=export`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to export data");
        return;
      }
      setExportData(json.data);
      setAction("export");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, tenant, token]);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/gdpr/self-service?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}&action=delete`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to request deletion");
        return;
      }
      setAction("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setDeleteConfirm(false);
    }
  }, [email, tenant, token]);

  const downloadExport = useCallback(() => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  if (!isValid) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <main style={{ maxWidth: 520, padding: 48, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center", margin: 24 }}>
          <h1 style={{ fontSize: 24, color: "#111827", margin: "0 0 16px" }}>Manage Your Data</h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.6 }}>
            This page requires a valid link from your email. Please use the &quot;Manage My Data&quot; link found in the footer of any email you received from us.
          </p>
        </main>
      </div>
    );
  }

  if (action === "done") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <main style={{ maxWidth: 520, padding: 48, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center", margin: 24 }}>
          <h1 style={{ fontSize: 24, color: "#111827", margin: "0 0 16px" }}>Deletion Request Submitted</h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.6 }}>
            Your data deletion request has been received and is being processed. All personal information associated with <strong>{email}</strong> will be removed within 30 days as required by GDPR.
          </p>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 16 }}>
            You may close this page.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "48px 16px" }}>
      <main style={{ maxWidth: 640, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: 40 }} role="main">
        <h1 style={{ fontSize: 24, color: "#111827", margin: "0 0 8px" }}>Manage Your Data</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 32px" }}>
          Data associated with <strong>{email}</strong>
        </p>

        {error && (
          <div role="alert" style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {action === "view" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section style={{ padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <h2 style={{ fontSize: 18, color: "#111827", margin: "0 0 8px" }}>Export Your Data</h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.5 }}>
                Download a copy of all data we have associated with your email address. This includes contact information, interaction history, and any scores or classifications.
              </p>
              <button
                onClick={handleExport}
                disabled={loading}
                style={{ padding: "10px 20px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Loading..." : "Export My Data"}
              </button>
            </section>

            <section style={{ padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <h2 style={{ fontSize: 18, color: "#111827", margin: "0 0 8px" }}>Email Preferences</h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.5 }}>
                Manage what types of emails you receive from us.
              </p>
              <a
                href={`/preferences?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}`}
                style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#4f46e5", border: "1px solid #4f46e5", borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: "none", display: "inline-block" }}
              >
                Manage Email Preferences
              </a>
            </section>

            <section style={{ padding: 24, border: "1px solid #fecaca", borderRadius: 8, backgroundColor: "#fef2f2" }}>
              <h2 style={{ fontSize: 18, color: "#991b1b", margin: "0 0 8px" }}>Delete My Data</h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.5 }}>
                Permanently delete all data associated with your email address. This action cannot be undone. You will be removed from all mailing lists and your data will be erased within 30 days.
              </p>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{ padding: "10px 20px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
                >
                  Request Data Deletion
                </button>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <p style={{ fontSize: 14, color: "#991b1b", fontWeight: 500, margin: 0 }}>
                    Are you sure? This cannot be undone.
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    style={{ padding: "10px 20px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Processing..." : "Yes, Delete Everything"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {action === "export" && exportData && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 18, color: "#111827", margin: 0 }}>Your Data Export</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={downloadExport}
                  style={{ padding: "8px 16px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => { setAction("view"); setExportData(null); }}
                  style={{ padding: "8px 16px", backgroundColor: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                >
                  Back
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(exportData).map(([key, value]) => (
                <details key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                  <summary style={{ padding: "12px 16px", backgroundColor: "#f9fafb", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
                    {key} {Array.isArray(value) ? `(${value.length} records)` : ""}
                  </summary>
                  <pre style={{ padding: 16, margin: 0, fontSize: 12, color: "#4b5563", overflow: "auto", maxHeight: 300, backgroundColor: "#fff" }}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ManageDataPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
        <p style={{ color: "#6b7280", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Loading...</p>
      </div>
    }>
      <ManageDataContent />
    </Suspense>
  );
}

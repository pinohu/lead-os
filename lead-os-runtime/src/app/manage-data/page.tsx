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
      <div className="flex min-h-screen items-center justify-center bg-muted font-sans">
        <main className="m-6 max-w-[520px] rounded-xl bg-card p-12 text-center shadow-md">
          <h1 className="mb-4 text-2xl text-foreground">Manage Your Data</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            This page requires a valid link from your email. Please use the &quot;Manage My Data&quot; link found in the footer of any email you received from us.
          </p>
        </main>
      </div>
    );
  }

  if (action === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted font-sans">
        <main className="m-6 max-w-[520px] rounded-xl bg-card p-12 text-center shadow-md">
          <h1 className="mb-4 text-2xl text-foreground">Deletion Request Submitted</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Your data deletion request has been received and is being processed. All personal information associated with <strong>{email}</strong> will be removed within 30 days as required by GDPR.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            You may close this page.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted px-4 py-12 font-sans">
      <main className="w-full max-w-[640px] rounded-xl bg-card p-10 shadow-md" role="main">
        <h1 className="mb-2 text-2xl text-foreground">Manage Your Data</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Data associated with <strong>{email}</strong>
        </p>

        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {action === "view" && (
          <div className="flex flex-col gap-4">
            <section className="rounded-lg border border-border p-6">
              <h2 className="mb-2 text-lg text-foreground">Export Your Data</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Download a copy of all data we have associated with your email address. This includes contact information, interaction history, and any scores or classifications.
              </p>
              <button
                onClick={handleExport}
                disabled={loading}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                style={{ cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Loading..." : "Export My Data"}
              </button>
            </section>

            <section className="rounded-lg border border-border p-6">
              <h2 className="mb-2 text-lg text-foreground">Email Preferences</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Manage what types of emails you receive from us.
              </p>
              <a
                href={`/preferences?email=${encodeURIComponent(email)}&tenant=${encodeURIComponent(tenant)}&token=${encodeURIComponent(token)}`}
                className="inline-block rounded-md border border-primary bg-card px-5 py-2.5 text-sm font-medium text-primary no-underline"
              >
                Manage Email Preferences
              </a>
            </section>

            <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
              <h2 className="mb-2 text-lg text-destructive">Delete My Data</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Permanently delete all data associated with your email address. This action cannot be undone. You will be removed from all mailing lists and your data will be erased within 30 days.
              </p>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="rounded-md bg-destructive px-5 py-2.5 text-sm font-medium text-white"
                >
                  Request Data Deletion
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-destructive">
                    Are you sure? This cannot be undone.
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="rounded-md bg-destructive px-5 py-2.5 text-sm font-medium text-white"
                    style={{ cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Processing..." : "Yes, Delete Everything"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-md border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground"
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg text-foreground">Your Data Export</h2>
              <div className="flex gap-2">
                <button
                  onClick={downloadExport}
                  className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
                >
                  Download JSON
                </button>
                <button
                  onClick={() => { setAction("view"); setExportData(null); }}
                  className="rounded-md border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {Object.entries(exportData).map(([key, value]) => (
                <details key={key} className="overflow-hidden rounded-lg border border-border">
                  <summary className="cursor-pointer bg-muted px-4 py-3 text-sm font-medium text-foreground">
                    {key} {Array.isArray(value) ? `(${value.length} records)` : ""}
                  </summary>
                  <pre className="max-h-[300px] overflow-auto bg-card p-4 font-mono text-xs text-muted-foreground">
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
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="font-sans text-muted-foreground">Loading...</p>
      </div>
    }>
      <ManageDataContent />
    </Suspense>
  );
}

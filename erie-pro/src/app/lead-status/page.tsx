"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface LeadStatus {
  id: string;
  niche: string;
  status: string;
  routedTo: string | null;
  createdAt: string;
  slaDeadline: string | null;
  outcome: string | null;
}

const STATUS_STEPS = ["Submitted", "Routed", "Contacted", "Completed"] as const;

function StatusTimeline({ current }: { current: string }) {
  const stepIndex = STATUS_STEPS.findIndex(
    (s) => s.toLowerCase() === current.toLowerCase()
  );
  const activeIdx = stepIndex >= 0 ? stepIndex : 0;

  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i <= activeIdx
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${
              i <= activeIdx
                ? "font-semibold text-gray-900 dark:text-white"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {step}
          </span>
          {i < STATUS_STEPS.length - 1 && (
            <div
              className={`h-0.5 w-6 ${
                i < activeIdx ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function LeadStatusPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [leads, setLeads] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);

  // Auto-fetch by token on mount
  const [tokenFetched, setTokenFetched] = useState(false);
  if (tokenFromUrl && !tokenFetched) {
    setTokenFetched(true);
    setLoading(true);
    fetch(`/api/lead-status?token=${encodeURIComponent(tokenFromUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeads(data.leads);
        } else {
          setError(data.error ?? "Lead not found");
        }
        setSearched(true);
      })
      .catch(() => setError("Failed to load status"))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setLeads([]);
    setEmailSentMessage(null);
    setSearched(true);

    try {
      const res = await fetch("/api/lead-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        // The API no longer returns lead data in the response body — it
        // emails secure status links to the address instead, to prevent
        // anyone who knows the email from enumerating its request history.
        setEmailSentMessage(
          data.message ??
            "If this email is associated with any service requests, we've sent status links to that inbox. Please check your email."
        );
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Failed to check status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Check Your Request Status
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Enter the email you used when submitting your service request and
        we&apos;ll send you a secure link to view its status.
      </p>

      {/* Email search form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Check-your-email confirmation after POST */}
      {emailSentMessage && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200 mb-6">
          {emailSentMessage}
        </div>
      )}

      {/* GET-by-token empty state (token path only — POST no longer
          returns the leads array, so the "no requests found" state only
          fires for the ?token= lookup flow). */}
      {searched && !loading && leads.length === 0 && !error && !emailSentMessage && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No request found for this status link.
        </p>
      )}

      <div className="space-y-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {lead.niche.replace(/-/g, " ")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Submitted{" "}
                  {new Date(lead.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  lead.status === "Completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : lead.status === "Routed"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                {lead.status}
              </span>
            </div>

            {lead.routedTo && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Assigned to: <strong>{lead.routedTo}</strong>
              </p>
            )}

            <StatusTimeline current={lead.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

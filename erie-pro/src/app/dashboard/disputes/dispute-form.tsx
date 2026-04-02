"use client";

import { useState } from "react";

const DISPUTE_REASONS = [
  { value: "wrong_number", label: "Wrong number / disconnected" },
  { value: "spam", label: "Spam / not a real inquiry" },
  { value: "out_of_area", label: "Outside my service area" },
  { value: "duplicate", label: "Duplicate lead" },
  { value: "other", label: "Other" },
];

interface DisputeFormProps {
  providerId: string;
  prefilledLeadId?: string;
}

export default function DisputeForm({ providerId, prefilledLeadId }: DisputeFormProps) {
  const [leadId, setLeadId] = useState(prefilledLeadId ?? "");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, providerId, reason, description }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Dispute filed successfully. We'll review it within 48 hours." });
        setLeadId("");
        setReason("");
        setDescription("");
      } else {
        setResult({ success: false, message: data.error ?? "Failed to file dispute." });
      }
    } catch {
      setResult({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {result && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-md p-3 text-sm ${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
          }`}
        >
          {result.message}
        </div>
      )}

      <div>
        <label htmlFor="leadId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Lead ID
        </label>
        <input
          id="leadId"
          type="text"
          required
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          placeholder="Lead ID (from your leads table)"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason
        </label>
        <select
          id="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a reason</option>
          {DISPUTE_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Details (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Provide any additional context for the dispute..."
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !leadId || !reason}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "File Dispute"}
      </button>
    </form>
  );
}

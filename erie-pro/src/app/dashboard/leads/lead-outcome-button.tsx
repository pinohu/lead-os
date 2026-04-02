"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OUTCOMES = [
  { value: "responded", label: "Responded", color: "text-blue-600 dark:text-blue-400" },
  { value: "converted", label: "Converted", color: "text-green-600 dark:text-green-400" },
  { value: "no_response", label: "No Response", color: "text-orange-600 dark:text-orange-400" },
  { value: "declined", label: "Declined", color: "text-red-600 dark:text-red-400" },
  { value: "cancelled", label: "Cancelled", color: "text-gray-600 dark:text-gray-400" },
] as const;

type OutcomeValue = (typeof OUTCOMES)[number]["value"];

interface LeadOutcomeButtonProps {
  leadId: string;
  currentOutcome: string | null;
}

export default function LeadOutcomeButton({ leadId, currentOutcome }: LeadOutcomeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const outcome = e.target.value as OutcomeValue;
    if (!outcome) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, outcome }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to update outcome");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const current = OUTCOMES.find((o) => o.value === currentOutcome);

  return (
    <div className="relative">
      <select
        value={currentOutcome ?? ""}
        onChange={handleChange}
        disabled={loading}
        className={`appearance-none rounded-md border px-2 py-1 pr-6 text-xs font-medium transition-colors
          ${loading ? "cursor-wait opacity-50" : "cursor-pointer"}
          ${current
            ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            : "border-dashed border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          }
          ${current?.color ?? "text-gray-500 dark:text-gray-400"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-950`}
        title={error ?? "Set lead outcome"}
      >
        <option value="" disabled>
          {loading ? "Saving..." : "Set outcome"}
        </option>
        {OUTCOMES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {/* Dropdown chevron */}
      <svg
        className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
      {error && (
        <p className="absolute left-0 top-full mt-0.5 whitespace-nowrap text-[10px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

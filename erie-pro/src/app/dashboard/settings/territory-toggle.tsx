"use client";

import { useState } from "react";

interface Territory {
  id: string;
  niche: string;
  city: string;
  deactivatedAt: Date | null;
}

export default function TerritoryToggle({ territories }: { territories: Territory[] }) {
  const [items, setItems] = useState(territories);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-600">
        No active territories. Territories are assigned when you claim a service area.
      </p>
    );
  }

  async function handleToggle(territoryId: string, currentlyActive: boolean) {
    setLoading(territoryId);
    setError(null);

    try {
      const res = await fetch("/api/provider/territory-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          territoryId,
          action: currentlyActive ? "pause" : "resume",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to update territory status.");
        return;
      }

      setItems((prev) =>
        prev.map((t) =>
          t.id === territoryId
            ? { ...t, deactivatedAt: currentlyActive ? new Date() : null }
            : t
        )
      );
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {items.map((t) => {
        const isActive = !t.deactivatedAt;
        const isLoading = loading === t.id;

        return (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {t.niche.replace(/-/g, " ")} — {t.city}
              </p>
              <p className={`text-xs font-medium ${isActive ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                {isActive ? "Active" : "Paused"}
              </p>
            </div>
            <button
              onClick={() => handleToggle(t.id, isActive)}
              disabled={isLoading}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                  : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              }`}
            >
              {isLoading ? "Updating..." : isActive ? "Pause" : "Resume"}
            </button>
          </div>
        );
      })}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

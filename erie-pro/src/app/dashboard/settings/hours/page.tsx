"use client";

// ── Business Hours Settings ──────────────────────────────────────────
// 7-day grid with open/close time selectors and timezone picker.

import { useState, useEffect } from "react";
import Link from "next/link";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface DayHours {
  open: string;
  close: string;
}

type DayConfig = DayHours | { closed: true };

type BusinessHours = Partial<Record<DayKey, DayConfig>>;

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "17:00";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const inputStyles =
  "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

function isDayClosed(config: DayConfig | undefined): boolean {
  if (!config) return false;
  return "closed" in config && config.closed === true;
}

function getDayTimes(config: DayConfig | undefined): { open: string; close: string } {
  if (!config || isDayClosed(config)) {
    return { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };
  }
  return config as DayHours;
}

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours>({
    mon: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
    tue: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
    wed: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
    thu: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
    fri: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
    sat: { closed: true },
    sun: { closed: true },
  });
  const [timezone, setTimezone] = useState("America/New_York");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Load current hours on mount
  useEffect(() => {
    fetch("/api/provider/hours")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.businessHours) {
            setHours(data.data.businessHours as BusinessHours);
          }
          if (data.data.timezone) {
            setTimezone(data.data.timezone);
          }
        }
        setStatus("idle");
      })
      .catch(() => {
        setStatus("idle");
      });
  }, []);

  function toggleDay(day: DayKey) {
    setHours((prev) => {
      const current = prev[day];
      if (isDayClosed(current)) {
        // Re-open with defaults
        return { ...prev, [day]: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE } };
      }
      // Close it
      return { ...prev, [day]: { closed: true as const } };
    });
  }

  function updateTime(day: DayKey, field: "open" | "close", value: string) {
    setHours((prev) => {
      const current = getDayTimes(prev[day]);
      return { ...prev, [day]: { ...current, [field]: value } };
    });
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/provider/hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessHours: hours, timezone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Failed to save business hours");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Hours</h1>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Business Hours
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Set when you are available to receive leads. Leads outside your
            hours will be queued for delivery when you open.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Settings
        </Link>
      </div>

      {/* ── Feedback Banners ─────────────────────────────────── */}
      {status === "success" && (
        <div className="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Business hours saved successfully.
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{errorMsg}</p>
        </div>
      )}

      {/* ── Timezone ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timezone
        </h2>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={inputStyles + " max-w-xs"}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </section>

      {/* ── Weekly Schedule ───────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Weekly Schedule
        </h2>

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const closed = isDayClosed(hours[key]);
            const times = getDayTimes(hours[key]);

            return (
              <div
                key={key}
                className="flex items-center gap-4 rounded-md border border-gray-100 dark:border-gray-800 p-3"
              >
                <div className="w-28 shrink-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                  </span>
                </div>

                {/* Toggle closed/open */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={!closed}
                  aria-label={`Toggle ${label}`}
                  onClick={() => toggleDay(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    closed ? "bg-gray-200 dark:bg-gray-700" : "bg-blue-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      closed ? "translate-x-0" : "translate-x-5"
                    }`}
                  />
                </button>

                {closed ? (
                  <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                    Closed
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={times.open}
                      onChange={(e) => updateTime(key, "open", e.target.value)}
                      className={inputStyles + " w-32"}
                      aria-label={`${label} open time`}
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="time"
                      value={times.close}
                      onChange={(e) => updateTime(key, "close", e.target.value)}
                      className={inputStyles + " w-32"}
                      aria-label={`${label} close time`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Save ──────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="inline-flex items-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Saving..." : "Save Business Hours"}
        </button>
      </div>
    </div>
  );
}

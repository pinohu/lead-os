"use client";

// ── SLA Countdown ─────────────────────────────────────────────────
// Ticking countdown shown on each active lead row.
//   - green: > 10 min left
//   - amber: 2–10 min left
//   - red:   < 2 min or overdue
// Client component so we can re-render every second without server RTT.

import { useEffect, useState } from "react";

interface SlaCountdownProps {
  /** ISO string or Date of the SLA deadline */
  deadline: string | Date;
  /** If true, shows nothing when overdue (provider already escalated) */
  hideWhenOverdue?: boolean;
}

function formatRemaining(ms: number): { label: string; overdue: boolean } {
  if (ms <= 0) {
    const over = Math.abs(ms);
    const mins = Math.floor(over / 60_000);
    const secs = Math.floor((over % 60_000) / 1_000);
    return {
      overdue: true,
      label: mins > 0 ? `${mins}m ${secs}s overdue` : `${secs}s overdue`,
    };
  }
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1_000);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    return { overdue: false, label: `${h}h ${mins % 60}m` };
  }
  return {
    overdue: false,
    label: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
  };
}

export function SlaCountdown({ deadline, hideWhenOverdue }: SlaCountdownProps) {
  const target =
    typeof deadline === "string" ? new Date(deadline).getTime() : deadline.getTime();

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = target - now;
  const { label, overdue } = formatRemaining(remaining);

  if (overdue && hideWhenOverdue) return null;

  const tone = overdue
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    : remaining < 2 * 60_000
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    : remaining < 10 * 60_000
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium tabular-nums ${tone}`}
      aria-label={overdue ? `SLA ${label}` : `SLA ${label} remaining`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          overdue || remaining < 2 * 60_000
            ? "bg-red-500 animate-pulse"
            : remaining < 10 * 60_000
            ? "bg-amber-500"
            : "bg-emerald-500"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

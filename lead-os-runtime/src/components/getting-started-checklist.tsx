"use client";

/**
 * Usage:
 *   import { GettingStartedChecklist } from "@/components/getting-started-checklist";
 *
 *   // In your dashboard page (must be a Client Component or nested inside one):
 *   <GettingStartedChecklist />
 *
 * The component fetches /api/dashboard/onboarding-status on mount and renders
 * nothing once all steps are complete or the operator has dismissed it.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingStatus {
  brandConfigured: boolean;
  emailConnected: boolean;
  widgetConfigured: boolean;
  firstLeadCaptured: boolean;
  scoringReviewed: boolean;
  goneLive: boolean;
}

interface ChecklistStep {
  id: keyof OnboardingStatus;
  title: string;
  description: string;
  href: string | null;
  linkLabel: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISMISSED_KEY = "leados_checklist_dismissed";

const STEPS: ChecklistStep[] = [
  {
    id: "brandConfigured",
    title: "Configure your brand",
    description: "Set your brand name, accent color, and support email so leads see your identity, not a default placeholder.",
    href: "/dashboard/settings",
    linkLabel: "Open settings",
  },
  {
    id: "emailConnected",
    title: "Connect email provider",
    description: "Add credentials for your email provider so LeadOS can send automated nurture sequences and notifications.",
    href: "/dashboard/credentials",
    linkLabel: "Add credentials",
  },
  {
    id: "widgetConfigured",
    title: "Set up your first widget",
    description: "Whitelist the origins where your capture widgets will run so the runtime accepts inbound submissions.",
    href: "/dashboard/settings",
    linkLabel: "Configure origins",
  },
  {
    id: "firstLeadCaptured",
    title: "Capture your first lead",
    description: "Submit a test lead through your widget or API to confirm the pipeline is running end-to-end.",
    href: null,
    linkLabel: null,
  },
  {
    id: "scoringReviewed",
    title: "Review your scoring rules",
    description: "Tune lead scoring weights and signal thresholds to match your qualification criteria.",
    href: "/dashboard/scoring",
    linkLabel: "Open scoring",
  },
  {
    id: "goneLive",
    title: "Go live",
    description: "Enable live mode to activate automated channel messaging, booking triggers, and workflow emissions.",
    href: "/dashboard/settings",
    linkLabel: "Enable live mode",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // localStorage unavailable in restricted environments — silent fail
  }
}

function countComplete(status: OnboardingStatus) {
  return STEPS.filter((s) => status[s.id]).length;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StepRowProps {
  step: ChecklistStep;
  complete: boolean;
  index: number;
}

function StepRow({ step, complete, index }: StepRowProps) {
  return (
    <li
      className={`flex items-start gap-3 py-3 border-b border-border ${complete ? "opacity-60" : ""}`}
    >
      {/* Checkbox indicator */}
      <span
        role="img"
        aria-label={complete ? "Complete" : "Incomplete"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          complete ? "bg-primary" : "border-2 border-border"
        }`}
      >
        {complete && (
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* Step body */}
      <div className="min-w-0 flex-1">
        <p
          className={`mb-0.5 text-sm font-semibold text-foreground ${complete ? "line-through" : ""}`}
          id={`checklist-step-${index}`}
        >
          Step {index + 1}: {step.title}
        </p>
        <p className="mb-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {step.description}
        </p>
        {!complete && step.href && step.linkLabel && (
          <Link
            href={step.href}
            aria-label={`${step.linkLabel} — ${step.title}`}
            className="inline-block rounded-md border border-primary px-2.5 py-1 text-[13px] font-semibold leading-snug text-primary no-underline"
          >
            {step.linkLabel}
          </Link>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GettingStartedChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isDismissed()) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch("/api/dashboard/onboarding-status")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ data: OnboardingStatus }>;
      })
      .then(({ data }) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    saveDismissed();
    setDismissed(true);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  // Keyboard handler: Escape collapses or dismisses
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        if (!collapsed) {
          setCollapsed(true);
        }
      }
    },
    [collapsed],
  );

  // Nothing to render while loading, dismissed, errored, or all steps done
  if (loading || dismissed || error) return null;
  if (!status) return null;

  const completedCount = countComplete(status);
  const totalCount = STEPS.length;
  const allComplete = completedCount === totalCount;

  // Hide once the operator has completed everything
  if (allComplete) return null;

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <section
      aria-labelledby="checklist-heading"
      onKeyDown={handleKeyDown}
      className={`mb-6 max-w-[720px] rounded-xl border border-border bg-card shadow-sm ${collapsed ? "px-5 py-4" : "p-5"}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Getting started
          </p>
          <h2
            id="checklist-heading"
            className="text-base font-bold text-foreground"
          >
            {completedCount} of {totalCount} steps complete
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-expanded={!collapsed}
            aria-controls="checklist-body"
            aria-label={collapsed ? "Expand getting started checklist" : "Collapse getting started checklist"}
            className="rounded-md border border-border px-2.5 py-1 text-[13px] font-semibold text-muted-foreground"
          >
            {collapsed ? "Show" : "Hide"}
          </button>

          {/* Dismiss */}
          <button
            ref={dismissButtonRef}
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss getting started checklist"
            className="rounded px-1.5 py-1 text-lg leading-none text-muted-foreground"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${completedCount} of ${totalCount} onboarding steps complete`}
        className="mt-3"
      >
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Collapsible step list */}
      <div
        id="checklist-body"
        aria-live="polite"
        className={collapsed ? "hidden" : "block"}
      >
        <ol
          aria-label="Onboarding steps"
          className="mt-2 list-none p-0"
        >
          {STEPS.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              complete={status[step.id]}
              index={i}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
